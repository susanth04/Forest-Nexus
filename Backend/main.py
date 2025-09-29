from google.cloud import vision
from google.cloud import translate_v2 as translate
from google.oauth2 import service_account
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import re
import unicodedata
import os
import warnings
import fitz  # PyMuPDF for PDF processing
import uvicorn
from datetime import datetime
from dotenv import load_dotenv
from pydantic import BaseModel


# Load environment variables
load_dotenv()

# Suppress warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Import Google Generative AI (Gemini)
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Configuration from environment variables
class Config:
    # Google Cloud credentials - convert relative path to absolute
    _creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "sih-2025-472809-8e136fdd6e00.json")
    GOOGLE_CREDENTIALS_PATH = "sih-2025-472809-8e136fdd6e00.json"
    
    # Gemini API key
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCD1Us-FSwyDY7sLI0iFWifOryWzK0uZEI")
    
    # Server settings
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", "8000"))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS settings
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    
    # File processing settings
    MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    MAX_TOTAL_SIZE_MB = int(os.getenv("MAX_TOTAL_SIZE_MB", "50"))
    
    # Translation settings
    AUTO_TRANSLATE = os.getenv("AUTO_TRANSLATE", "True").lower() == "true"
    SOURCE_LANGUAGE = os.getenv("SOURCE_LANGUAGE", "te")  # Telugu by default
    TARGET_LANGUAGE = os.getenv("TARGET_LANGUAGE", "en")  # English by default

# Initialize configuration
config = Config()

# Initialize FastAPI app
app = FastAPI(
    title="FRA Document OCR & AI Entity Recognition + Scheme Recommendation",
    description="API for processing FRA documents using Google Cloud Vision OCR, Gemini AI for NER, and FRA scheme recommendations",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage for results (in production, use a database)
results_storage = {}

# FRA claimant data for scheme recommendation
fra_claimant = {
    "Name": "Ramesh",
    "Father": "Sothan",
    "Village": "Kaltapally",
    "District": "Adilabad",
    "State": "Telangana",
    "Patta": "PAT-000123",
    "Survey": "45/2",
    "Coordinates": "19.6354 N, 18.5371 E",
    "Land Area (hectares)": 2.5,
    "Claim Status": "Granted",
    "SC": False,
    "ST": True,
    "Other Vulnerable": False,
    "Income Level": "Low",
    "Water Index": 0.25,
    "Gender": "Male",
    "Age": 35,
    "Village Population": 600,
    "Village ST Percentage": 60,
    "Aspirational District": True,
    "Village ST Population": 360,
    "Unelectrified HH": True,
    "Health Facility Distance Km": 6,
    "Terrain": "Hilly",
    "No Pucca House": True,
    "No Toilet": True,
    "Pregnant or Lactating": False,
    "Children 0-6": 2,
    "Student": True,
    "Youth/SHG/VDVK": True,
    "Fisherman/CFR Holder": True,
    "Livestock Interest": True,
    "PRI Member/Official": True,
    "Homestay Interest": True,
    "SCD Affected": True
}

# Pydantic models for request/response
class ProcessingResult(BaseModel):
    filename: str
    raw_text: str
    cleaned_text: str
    standardized_text: str
    translated_text: Optional[str] = None
    original_language: Optional[str] = None
    entities: Dict[str, Any]

class EntityExtractionResponse(BaseModel):
    success: bool
    message: str
    results: List[ProcessingResult]

class HealthResponse(BaseModel):
    status: str
    gemini_available: bool
    vision_api_available: bool
    translate_api_available: bool

class TranslationHealthResponse(BaseModel):
    status: str
    translate_api_available: bool
    supported_languages: int
    test_translation: str

# DSS function for FRA schemes
def fra_dss(claimant):
    schemes = []
    
    # FRA Rights
    if claimant["Claim Status"] == "Granted":
        schemes.append("Individual Forest Rights - Title to forest land under occupation (up to 4 ha)")
        if claimant["ST"]:
            schemes.append("Community Forest Rights - Nistar, grazing, MFP collection, habitat for PTGs")
        if claimant["Village ST Percentage"] >= 50 or (claimant["Aspirational District"] and claimant["Village ST Population"] >= 50):
            schemes.append("Community Forest Resource Rights - Management and conservation authority")

    # Core CSS Schemes
    if claimant["Claim Status"] == "Granted":
        schemes.append("National Social Assistance Programme (NSAP)")
        schemes.append("Mahatma Gandhi National Rural Employment Guarantee Programme (MGNREGA)")
        if claimant["SC"]:
            schemes.append("Umbrella Scheme for Development of Scheduled Castes")
        if claimant["ST"]:
            schemes.append("Umbrella Programme for Development of Scheduled Tribes")
        if claimant["Other Vulnerable"]:
            schemes.append("Umbrella Programme for Development of Other Vulnerable Groups")

    # DAJGUA
    if (claimant["Village Population"] >= 500 and claimant["Village ST Percentage"] >= 50) or (claimant["Aspirational District"] and claimant["Village ST Population"] >= 50):
        schemes.append("Village Eligible for DAJGUA Interventions")
        if claimant["ST"]:
            if claimant["No Pucca House"]:
                schemes.append("Priority: PMAY-G for low-income ST HH")
            if claimant["Water Index"] < 0.3:
                schemes.append("Priority: JJM due to low water index")
            if claimant["Unelectrified HH"]:
                schemes.append("Eligible: House Electrification under RDSS")
    
    # Other CSS Schemes
    if claimant["Land Area (hectares)"] <= 2.5 and claimant["Claim Status"] == "Granted":
        schemes.append("Pradhan Mantri Krishi Sinchai Yojana (Micro-irrigation)")
        schemes.append("PM Kisan Samman Nidhi (Income Support)")

    if claimant["Water Index"] < 0.3:
        schemes.append("Priority: Jal Jeevan Mission / Borewell schemes (low water index)")

    if claimant["Income Level"] == "Low" or claimant["No Pucca House"] or claimant["No Toilet"]:
        schemes.append("PM Awas Yojana – PMAY (Rural Housing Assistance)")
        schemes.append("Swachh Bharat Mission – SBM Rural/Urban (Sanitation)")

    return schemes

def make_json_serializable(obj):
    """Convert numpy types to JSON serializable types"""
    if hasattr(obj, 'dtype'):
        if 'float' in str(obj.dtype):
            return float(obj)
        elif 'int' in str(obj.dtype):
            return int(obj)
        else:
            return str(obj)
    elif isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_serializable(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(make_json_serializable(item) for item in obj)
    elif hasattr(obj, 'item'):  # numpy scalar
        return obj.item()
    else:
        return obj

class OCRProcessor:
    """Handle Google Cloud Vision API OCR processing"""
    
    def __init__(self, credentials_path):
        """Initialize with Google Cloud credentials"""
        try:
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            self.client = vision.ImageAnnotatorClient(credentials=credentials)
            self.credentials_loaded = True
        except Exception as e:
            print(f"Failed to load Google Cloud credentials: {str(e)}")
            self.credentials_loaded = False
    
    def extract_text_from_image(self, image_bytes):
        """Extract text from image using Vision API"""
        if not self.credentials_loaded:
            return None
            
        try:
            image = vision.Image(content=image_bytes)
            response = self.client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(f"Vision API error: {response.error.message}")
            
            # Get full text annotation
            if response.full_text_annotation:
                return response.full_text_annotation.text
            else:
                return ""
                
        except Exception as e:
            print(f"OCR processing failed: {str(e)}")
            return None
    
    def extract_text_from_pdf(self, pdf_bytes):
        """Extract text from PDF by converting pages to images"""
        if not self.credentials_loaded:
            return None
            
        try:
            # Open PDF from bytes
            doc = fitz.open("pdf", pdf_bytes)
            all_text = ""
            
            for page_num in range(doc.page_count):
                # Convert page to image
                page = doc[page_num]
                mat = fitz.Matrix(2, 2)  # Increase resolution
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")
                
                # Extract text using Vision API
                page_text = self.extract_text_from_image(img_data)
                if page_text:
                    all_text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
            
            doc.close()
            return all_text
            
        except Exception as e:
            print(f"PDF processing failed: {str(e)}")
            return None

class TranslationService:
    """Handle text translation using Google Translate API"""
    
    def __init__(self):
        """Initialize Google Translate client"""
        try:
            credentials_path = config.GOOGLE_CREDENTIALS_PATH
            
            if os.path.exists(credentials_path):
                credentials = service_account.Credentials.from_service_account_file(
                    credentials_path, 
                    scopes=[
                        'https://www.googleapis.com/auth/cloud-platform',
                        'https://www.googleapis.com/auth/cloud-translation'
                    ]
                )
                self.translate_client = translate.Client(credentials=credentials)
                print("✅ Google Translate API initialized successfully")
            else:
                print("❌ Google service account key not found at:", credentials_path)
                self.translate_client = None
        except Exception as e:
            print(f"❌ Failed to initialize Google Translate: {str(e)}")
            self.translate_client = None
    
    def detect_language(self, text):
        """Detect language using Google Translate API"""
        if not self.translate_client:
            return self._fallback_language_detection(text)
        
        try:
            result = self.translate_client.detect_language(text[:1000])
            detected_lang = result['language']
            confidence = result['confidence']
            
            return {
                'language': detected_lang,
                'confidence': confidence
            }
            
        except Exception as e:
            print(f"Language detection error: {str(e)}")
            return self._fallback_language_detection(text)
    
    def _fallback_language_detection(self, text):
        """Enhanced fallback language detection"""
        language_ranges = {
            'hi': [(0x0900, 0x097F)],  # Devanagari
            'bn': [(0x0980, 0x09FF)],  # Bengali
            'te': [(0x0C00, 0x0C7F)],  # Telugu
            'ta': [(0x0B80, 0x0BFF)],  # Tamil
            'ar': [(0x0600, 0x06FF)],  # Arabic
            'zh': [(0x4E00, 0x9FFF)],  # Chinese
        }
        
        char_counts = {}
        total_chars = 0
        sample_text = text[:1000] if len(text) > 1000 else text
        
        for char in sample_text:
            if char.isalpha():
                total_chars += 1
                char_code = ord(char)
                
                detected_lang = None
                for lang, ranges in language_ranges.items():
                    for start, end in ranges:
                        if start <= char_code <= end:
                            detected_lang = lang
                            break
                    if detected_lang:
                        break
                
                if detected_lang:
                    char_counts[detected_lang] = char_counts.get(detected_lang, 0) + 1
        
        if total_chars > 0 and char_counts:
            most_common_lang = max(char_counts, key=char_counts.get)
            confidence = char_counts[most_common_lang] / total_chars
            
            if confidence > 0.1:
                return {
                    'language': most_common_lang,
                    'confidence': confidence
                }
        
        return {'language': 'en', 'confidence': 0.0}
    
    def translate_with_google(self, text, target_language='en'):
        """Translate text using Google Translate API"""
        if not self.translate_client:
            return text
        
        try:
            detection = self.detect_language(text)
            source_lang = detection['language']
            
            if source_lang == target_language or source_lang == 'en':
                return text
            
            result = self.translate_client.translate(
                text,
                target_language=target_language,
                source_language=source_lang if source_lang != 'unknown' else None,
                format_='text'
            )
            
            return result['translatedText']
            
        except Exception as e:
            print(f"Google Translate error: {str(e)}")
            return text
    
    def should_translate(self, text):
        """Determine if text needs translation"""
        if not config.AUTO_TRANSLATE:
            return False
        
        detection = self.detect_language(text)
        if detection and detection.get('language') == 'te':
            confidence = detection.get('confidence', 0)
            return confidence > 0.1
        
        return False

class TextPreprocessor:
    """Handle text cleaning and normalization"""
    
    @staticmethod
    def clean_text(text):
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        text = unicodedata.normalize('NFKD', text)
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s\-.,;:()\[\]{}\'"/\\]', ' ', text)
        
        replacements = {
            r'\bl\b': 'I',
            r'\b0\b': 'O',
            r'rn': 'm',
            r'[|!]': 'l',
        }
        
        for pattern, replacement in replacements.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        text = ' '.join(text.split())
        return text.strip()
    
    @staticmethod
    def standardize_spacing(text):
        """Standardize spacing and line breaks"""
        if not text:
            return ""
        
        text = re.sub(r'\r\n|\r|\n', ' ', text)
        text = re.sub(r'\s*([,.;:!?])\s*', r'\1 ', text)
        text = re.sub(r'\s{2,}', ' ', text)
        
        return text.strip()

class NERExtractor:
    """Handle Named Entity Recognition using Google Gemini API"""
    
    def __init__(self):
        """Initialize Gemini NER model"""
        self.gemini_model = None
        self.api_key = config.GEMINI_API_KEY
        self.load_model()
    
    def load_model(self):
        """Load Gemini model"""
        if GEMINI_AVAILABLE:
            try:
                genai.configure(api_key=self.api_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
                print("✅ Gemini API initialized successfully")
            except Exception as e:
                print(f"❌ Gemini API initialization failed: {str(e)}")
                self.gemini_model = None
        else:
            print("❌ Google Generative AI package not available")
    
    def extract_entities_gemini(self, text):
        """Extract entities using Google Gemini API"""
        if not self.gemini_model or not text:
            return {}
        
        try:
            prompt = f"""
You are an expert multilingual NER system specialized in official government documents worldwide. 

TASK: Extract entities from this document text (originally translated from any language to English).

DOCUMENT TEXT:
{text}

INSTRUCTIONS:
1. This document may have been translated from ANY language (Hindi, Telugu, Tamil, Arabic, Spanish, French, etc.)
2. Extract ALL entities even if names seem unusual due to transliteration
3. Look for patterns that indicate official document entities regardless of language origin
4. Be extra careful with proper names that may have been transliterated

ENTITY TYPES TO EXTRACT:
- PATTA_HOLDER_NAME: Primary land title holder names, main applicant names
- PATTA_NUMBER: Patta numbers, land title numbers, document numbers (PAT-XXX, REG-XXX, etc.)
- CLAIM_STATUS: Application status like 'granted', 'pending', 'approved', 'rejected', 'verified'
- PERSON: Other person names (family members, witnesses, officers - excluding main patta holders)
- PLACE_NAME: Villages, cities, districts, states, countries
- ORGANIZATION: Government departments, committees, institutions
- COORDINATES: Latitude/longitude, GPS coordinates
- DATE: All dates in any format
- LAND_AREA: Area measurements (hectares, acres, sq meters)
- SURVEY_NUMBER: Land survey numbers
- ADDRESS: Complete addresses or location descriptions
- PHONE_NUMBER: Contact numbers
- EMAIL: Email addresses

RETURN FORMAT - EXACT JSON:
{{
    "PATTA_HOLDER_NAME": [],
    "PATTA_NUMBER": [],
    "CLAIM_STATUS": [],
    "PERSON": [],
    "PLACE_NAME": [],
    "ORGANIZATION": [],
    "COORDINATES": [],
    "DATE": [],
    "LAND_AREA": [],
    "SURVEY_NUMBER": [],
    "ADDRESS": [],
    "PHONE_NUMBER": [],
    "EMAIL": []
}}

CRITICAL RULES:
- Include ALL potential names even if spelling seems unusual
- Look for transliterated names that might appear as multiple words
- Extract numbers with prefixes/suffixes as document numbers
- Return ONLY valid JSON, no explanations
"""

            response = self.gemini_model.generate_content(prompt)
            
            try:
                response_text = response.text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text[7:]
                if response_text.startswith('```'):
                    response_text = response_text[3:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                
                entities = json.loads(response_text)
                
                expected_keys = ["PATTA_HOLDER_NAME", "PATTA_NUMBER", "CLAIM_STATUS", "PERSON", "PLACE_NAME", 
                               "ORGANIZATION", "COORDINATES", "DATE", "LAND_AREA", "SURVEY_NUMBER", 
                               "ADDRESS", "PHONE_NUMBER", "EMAIL"]
                
                for key in expected_keys:
                    if key not in entities:
                        entities[key] = []
                    elif not isinstance(entities[key], list):
                        entities[key] = [entities[key]] if entities[key] else []
                
                return entities
                
            except json.JSONDecodeError as e:
                print(f"Gemini API returned invalid JSON format: {str(e)}")
                return {}
                
        except Exception as e:
            print(f"Gemini NER extraction failed: {str(e)}")
            return {}
    
    def extract_all_entities(self, text):
        """Extract entities using Gemini API"""
        if self.gemini_model:
            gemini_entities = self.extract_entities_gemini(text)
            return gemini_entities if isinstance(gemini_entities, dict) else {}
        else:
            print("⚠️ Gemini API not available. No entity extraction will be performed.")
            return {}

# Global instances
ocr_processor = OCRProcessor(config.GOOGLE_CREDENTIALS_PATH)
text_preprocessor = TextPreprocessor()
ner_extractor = NERExtractor()
translation_service = TranslationService()

# FRA Scheme Recommendation Endpoint
@app.get("/eligible-schemes")
def get_schemes():
    """Get eligible FRA schemes for the default claimant"""
    return {
        "claimant": {
            "name": fra_claimant["Name"],
            "father": fra_claimant["Father"],
            "village": fra_claimant["Village"],
            "district": fra_claimant["District"],
            "state": fra_claimant["State"],
            "landArea": fra_claimant["Land Area (hectares)"],
            "claimStatus": fra_claimant["Claim Status"],
        },
        "eligible_schemes": fra_dss(fra_claimant)
    }

@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        gemini_available=GEMINI_AVAILABLE and ner_extractor.gemini_model is not None,
        vision_api_available=ocr_processor.credentials_loaded,
        translate_api_available=translation_service.translate_client is not None
    )

@app.get("/health/translation", response_model=TranslationHealthResponse)
async def translation_health_check():
    """Dedicated health check for Google Translation API"""
    try:
        if not translation_service.translate_client:
            return TranslationHealthResponse(
                status="unhealthy",
                translate_api_available=False,
                supported_languages=0,
                test_translation="Translation service not available"
            )
        
        test_text = "Hello"
        test_result = translation_service.translate_with_google(test_text, 'hi')
        
        try:
            languages = translation_service.translate_client.get_languages()
            language_count = len(languages) if languages else 0
        except Exception:
            language_count = 0
        
        return TranslationHealthResponse(
            status="healthy",
            translate_api_available=True,
            supported_languages=language_count,
            test_translation=f"Test: '{test_text}' → '{test_result}'"
        )
        
    except Exception as e:
        return TranslationHealthResponse(
            status="unhealthy",
            translate_api_available=False,
            supported_languages=0,
            test_translation=f"Error: {str(e)}"
        )

@app.post("/process-documents", response_model=EntityExtractionResponse)
async def process_documents(files: List[UploadFile] = File(...)):
    """Process uploaded FRA documents (images or PDFs) for OCR and NER"""
    
    if files:
        allowed_types = {'image/png', 'image/jpeg', 'image/jpg', 'application/pdf'}
        for file in files:
            if file.content_type not in allowed_types:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "message": f"File {file.filename} has unsupported type {file.content_type}",
                        "results": []
                    }
                )
        
        if ocr_processor.credentials_loaded:
            results = []
            
            try:
                for file in files:
                    print(f"\nProcessing file: {file.filename}")
                    file_content = await file.read()
                    
                    if file.content_type == "application/pdf":
                        raw_text = ocr_processor.extract_text_from_pdf(file_content)
                    else:
                        raw_text = ocr_processor.extract_text_from_image(file_content)
                    
                    if raw_text:
                        cleaned_text = text_preprocessor.clean_text(raw_text)
                        standardized_text = text_preprocessor.standardize_spacing(cleaned_text)
                        
                        translated_text = standardized_text
                        original_language = "Unknown"
                        
                        if translation_service.should_translate(standardized_text):
                            detection = translation_service.detect_language(standardized_text)
                            if detection:
                                original_language = detection.get('language', 'Unknown')
                                translated_text = translation_service.translate_with_google(standardized_text, 'en')
                        
                        if ner_extractor.gemini_model:
                            try:
                                entities = ner_extractor.extract_all_entities(translated_text)
                            except Exception as e:
                                print(f"NER failed: {str(e)}")
                                entities = {}
                        else:
                            entities = {}
                        
                        serializable_entities = make_json_serializable(entities)
                        
                        result = ProcessingResult(
                            filename=file.filename,
                            raw_text=raw_text,
                            cleaned_text=cleaned_text,
                            standardized_text=standardized_text,
                            translated_text=translated_text,
                            original_language=original_language,
                            entities=serializable_entities
                        )
                        results.append(result)
                        
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        storage_key = f"{timestamp}_{file.filename}"
                        results_storage[storage_key] = result.dict()
                    else:
                        print(f"No text found in file: {file.filename}")
                
                batch_key = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                results_storage[batch_key] = {
                    "success": True,
                    "message": f"Successfully processed {len(results)} document(s)",
                    "results": [r.dict() for r in results],
                    "processing_time": 0.0
                }
                
                response_data = EntityExtractionResponse(
                    success=True,
                    message=f"Successfully processed {len(results)} document(s)",
                    results=results
                )
                
                response_dict = response_data.dict()
                response_dict["batch_key"] = batch_key
                
                return JSONResponse(
                    status_code=200,
                    content=response_dict,
                    headers={
                        "access-control-allow-credentials": "true",
                        "access-control-allow-origin": "*",
                    }
                )
                
            except Exception as e:
                error_msg = f"Processing failed: {str(e)}"
                print(f"Main processing error: {error_msg}")
                
                return JSONResponse(
                    status_code=500,
                    content={
                        "success": False,
                        "message": error_msg,
                        "results": [],
                        "error_details": str(e)
                    }
                )
        else:
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Google Cloud Vision API not configured",
                    "results": []
                }
            )
    else:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "No files provided",
                "results": []
            }
        )

@app.post("/extract-text")
async def extract_text_only(files: List[UploadFile] = File(...)):
    """Extract text only from documents (no NER processing)"""
    
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    if not ocr_processor.credentials_loaded:
        raise HTTPException(status_code=500, detail="Google Cloud Vision API not configured")
    
    results = []
    
    try:
        for file in files:
            file_content = await file.read()
            
            if file.content_type == "application/pdf":
                raw_text = ocr_processor.extract_text_from_pdf(file_content)
            else:
                raw_text = ocr_processor.extract_text_from_image(file_content)
            
            if raw_text is None:
                continue
            
            cleaned_text = text_preprocessor.clean_text(raw_text)
            standardized_text = text_preprocessor.standardize_spacing(cleaned_text)
            
            result_data = {
                "filename": file.filename,
                "raw_text": raw_text,
                "cleaned_text": cleaned_text,
                "standardized_text": standardized_text
            }
            results.append(result_data)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            storage_key = f"text_{timestamp}_{file.filename}"
            results_storage[storage_key] = result_data
        
        batch_key = f"text_batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        batch_data = {
            "success": True,
            "message": f"Successfully extracted text from {len(results)} document(s)",
            "results": results
        }
        results_storage[batch_key] = batch_data
        
        response = batch_data.copy()
        response["batch_key"] = batch_key
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")


# --------------------------
# Gemini AI Chat Endpoint
# --------------------------

class ChatRequest(BaseModel):
    user_input: str
    ocr_context: Optional[str] = ""

class ChatResponse(BaseModel):
    bot_reply: str

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat endpoint for FRA-CSS Assistant using Gemini API.
    Receives user input and optional OCR context, returns bot reply.
    """
    if not ner_extractor.gemini_model:
        return {"bot_reply": "⚠️ Gemini API not available. Cannot generate response."}

    try:
        system_prompt = (
            f"You are an expert assistant for the Forest Rights Act (FRA) Decision Support System "
            f"focusing exclusively on Central Sector Schemes (CSS).\n\n"
            f"CONTEXT: FRA OCR Extracted Data:\n{request.ocr_context}\n\n"
            f"INSTRUCTIONS:\n"
            f"- Only discuss Central Sector Schemes like PM-KISAN, MGNREGA, Jal Jeevan Mission, Ayushman Bharat PM-JAY, PMAY-G, PM-KUSUM, Swachh Bharat Mission, etc.\n"
            f"- Provide specific eligibility criteria, application processes, and benefits.\n"
            f"- Reference the user's extracted data when relevant (name, location, land area, etc.)\n"
            f"- Keep responses concise (2-4 sentences)\n"
            f"- Include actionable next steps\n"
            f"- Use a helpful, professional tone\n\n"
            f"USER QUESTION: {request.user_input}"
        )

        response = ner_extractor.gemini_model.generate_content(system_prompt)
        bot_reply = response.text.strip() if response.text else "I couldn't generate a proper response. Please rephrase your question about Central Sector Schemes."

        # Clean code block formatting if any
        if bot_reply.startswith("```"):
            bot_reply = bot_reply.strip("```").strip()

        return {"bot_reply": bot_reply}

    except Exception as e:
        print(f"Chat endpoint error: {str(e)}")
        return {"bot_reply": "⚠️ I'm having trouble connecting to my knowledge base. Try again later."}

@app.get("/download-results/{key}")
async def download_results_json(key: str):
    """Download processing results as JSON file"""
    if key not in results_storage:
        raise HTTPException(status_code=404, detail="Results not found")
    
    results = results_storage[key]
    json_data = json.dumps(results, indent=2, ensure_ascii=False)
    filename = f"results_{key}.json"
