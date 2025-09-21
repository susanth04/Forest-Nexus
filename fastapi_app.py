from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import re
import unicodedata
import os
import warnings
import numpy as np
import fitz  # PyMuPDF for PDF processing
import tempfile
import uvicorn
from io import BytesIO
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Suppress warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Google Cloud Vision API
from google.cloud import vision
from google.oauth2 import service_account

# Import Google Generative AI (Gemini)
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Configuration from environment variables
class Config:
    # Google Cloud credentials
    GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "sih-2025-472809-8e136fdd6e00.json")
    
    # Gemini API key
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # Server settings
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", "8000"))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS settings
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    
    # File processing settings
    MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    MAX_TOTAL_SIZE_MB = int(os.getenv("MAX_TOTAL_SIZE_MB", "50"))

# Initialize configuration
config = Config()

# Initialize FastAPI app
app = FastAPI(
    title="FRA Document OCR & AI Entity Recognition",
    description="API for processing FRA documents using Google Cloud Vision OCR and Gemini AI for Named Entity Recognition",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage for results (in production, use a database)
results_storage = {}

# Pydantic models for request/response
class ProcessingResult(BaseModel):
    filename: str
    raw_text: str
    cleaned_text: str
    standardized_text: str
    entities: Dict[str, Any]

class EntityExtractionResponse(BaseModel):
    success: bool
    message: str
    results: List[ProcessingResult]

class HealthResponse(BaseModel):
    status: str
    gemini_available: bool
    vision_api_available: bool


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


class TextPreprocessor:
    """Handle text cleaning and normalization"""
    
    @staticmethod
    def clean_text(text):
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        # Unicode normalization
        text = unicodedata.normalize('NFKD', text)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common OCR artifacts
        text = re.sub(r'[^\w\s\-.,;:()\[\]{}\'"/\\]', ' ', text)
        
        # Fix common OCR errors
        replacements = {
            r'\bl\b': 'I',  # Common OCR error: l instead of I
            r'\b0\b': 'O',  # Common OCR error: 0 instead of O
            r'rn': 'm',     # Common OCR error: rn instead of m
            r'[|!]': 'l',   # Common OCR error: | or ! instead of l
        }
        
        for pattern, replacement in replacements.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        # Clean up spacing
        text = ' '.join(text.split())
        
        return text.strip()
    
    @staticmethod
    def standardize_spacing(text):
        """Standardize spacing and line breaks"""
        if not text:
            return ""
        
        # Normalize line breaks
        text = re.sub(r'\r\n|\r|\n', ' ', text)
        
        # Fix spacing around punctuation
        text = re.sub(r'\s*([,.;:!?])\s*', r'\1 ', text)
        
        # Remove multiple spaces
        text = re.sub(r'\s{2,}', ' ', text)
        
        return text.strip()


class NERExtractor:
    """Handle Named Entity Recognition using Google Gemini API only"""
    
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
                self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
                print("✅ Gemini API initialized successfully")
            except Exception as e:
                print(f"❌ Gemini API initialization failed: {str(e)}")
                self.gemini_model = None
        else:
            print("❌ Google Generative AI package not available. Please install: pip install google-generativeai")
    
    def extract_entities_gemini(self, text):
        """Extract entities using Google Gemini API"""
        if not self.gemini_model or not text:
            return {}
        
        try:
            # Create a comprehensive prompt for FRA document analysis
            prompt = f"""
Analyze the following FRA (Forest Rights Act) document text and extract specific entities. This is an official government document related to forest land rights in India.

Document text to analyze:
{text}

Please extract the following entities and return ONLY a valid JSON object with this exact structure:
{{
    "PERSON": [],
    "PATTA_HOLDER_NAME": [],
    "VILLAGE": [],
    "PATTA_NUMBER": [],
    "COORDINATES": [],
    "CLAIM_STATUS": [],
    "ORGANIZATION": [],
    "DATES": [],
    "SURVEY_NUMBERS": [],
    "LAND_DETAILS": [],
    "MISCELLANEOUS": []
}}

Focus on extracting:
- PERSON: Other person names like applicants, witness names, officer names (excluding patta holders)
- PATTA_HOLDER_NAME: Specifically the names of patta holders, land title holders, main beneficiaries
- VILLAGE: Village names, gram panchayat names, tehsil, district, state
- PATTA_NUMBER: Patta numbers, patta document numbers, land title numbers, record numbers
- COORDINATES: GPS coordinates, latitude/longitude, survey coordinates
- CLAIM_STATUS: Status like 'granted', 'pending', 'approved', 'rejected', 'under process', 'verified'
- ORGANIZATION: Forest department, government offices, committees
- DATES: Application dates, approval dates, survey dates
- SURVEY_NUMBERS: Plot numbers, survey numbers, khasra numbers
- LAND_DETAILS: Area measurements, land type, forest classification
- MISCELLANEOUS: Any other important information not fitting above categories

Instructions:
- Return ONLY the JSON object, no markdown formatting or explanations
- Each array should contain strings of the extracted entities
- If no entities found for a category, keep it as empty array []
- Ensure all person names are properly capitalized
- Include full location hierarchies (village, tehsil, district, state)
"""

            response = self.gemini_model.generate_content(prompt)
            
            # Try to parse the response as JSON
            try:
                # Clean the response text - remove any markdown formatting
                response_text = response.text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text[7:]
                if response_text.startswith('```'):
                    response_text = response_text[3:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                
                entities = json.loads(response_text)
                
                # Ensure all values are lists
                expected_keys = ["PERSON", "PATTA_HOLDER_NAME", "VILLAGE", "PATTA_NUMBER", "COORDINATES", "CLAIM_STATUS", 
                               "ORGANIZATION", "DATES", "SURVEY_NUMBERS", "LAND_DETAILS", "MISCELLANEOUS"]
                
                for key in expected_keys:
                    if key not in entities:
                        entities[key] = []
                    elif not isinstance(entities[key], list):
                        entities[key] = [entities[key]] if entities[key] else []
                
                return entities
                
            except json.JSONDecodeError as e:
                print(f"Gemini API returned invalid JSON format: {str(e)}")
                print(f"Raw response: {response.text[:200]}...")
                return {}
                
        except Exception as e:
            print(f"Gemini NER extraction failed: {str(e)}")
            return {}
    
    def extract_all_entities(self, text):
        """Extract entities using Gemini API"""
        all_entities = {}
        
        # Only use Gemini for entity extraction
        if self.gemini_model:
            gemini_entities = self.extract_entities_gemini(text)
            all_entities["gemini"] = gemini_entities
        else:
            print("⚠️ Gemini API not available. No entity extraction will be performed.")
        
        return all_entities


# Global instances
ocr_processor = OCRProcessor(config.GOOGLE_CREDENTIALS_PATH)
text_preprocessor = TextPreprocessor()
ner_extractor = NERExtractor()


@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        gemini_available=GEMINI_AVAILABLE and ner_extractor.gemini_model is not None,
        vision_api_available=ocr_processor.credentials_loaded
    )


@app.post("/process-documents", response_model=EntityExtractionResponse)
async def process_documents(files: List[UploadFile] = File(...)):
    """
    Process uploaded FRA documents (images or PDFs) for OCR and NER
    
    Args:
        files: List of uploaded files (PNG, JPG, JPEG, PDF)
        
    Returns:
        EntityExtractionResponse with processing results
    """
    
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Check file types
    allowed_types = {'image/png', 'image/jpeg', 'image/jpg', 'application/pdf'}
    for file in files:
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"File {file.filename} has unsupported type {file.content_type}. Allowed: PNG, JPG, JPEG, PDF"
            )
    
    if not ocr_processor.credentials_loaded:
        raise HTTPException(status_code=500, detail="Google Cloud Vision API not configured")
    
    results = []
    
    try:
        for file in files:
            # Read file content
            file_content = await file.read()
            
            # Extract text based on file type
            if file.content_type == "application/pdf":
                raw_text = ocr_processor.extract_text_from_pdf(file_content)
            else:
                raw_text = ocr_processor.extract_text_from_image(file_content)
            
            if raw_text is None:
                continue  # Skip files that couldn't be processed
            
            # Clean and preprocess text
            cleaned_text = text_preprocessor.clean_text(raw_text)
            standardized_text = text_preprocessor.standardize_spacing(cleaned_text)
            
            # Extract entities
            entities = ner_extractor.extract_all_entities(standardized_text)
            
            # Make results JSON serializable
            serializable_entities = make_json_serializable(entities)
            
            result = ProcessingResult(
                filename=file.filename,
                raw_text=raw_text,
                cleaned_text=cleaned_text,
                standardized_text=standardized_text,
                entities=serializable_entities
            )
            results.append(result)
            
            # Store result for download (using timestamp + filename as key)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            storage_key = f"{timestamp}_{file.filename}"
            results_storage[storage_key] = result.dict()
        
        # Also store the batch results
        batch_key = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        results_storage[batch_key] = {
            "success": True,
            "message": f"Successfully processed {len(results)} document(s)",
            "results": [r.dict() for r in results],
            "processing_time": 0.0  # Can be calculated if needed
        }
        
        response_data = EntityExtractionResponse(
            success=True,
            message=f"Successfully processed {len(results)} document(s)",
            results=results
        )
        
        # Add batch key for download reference
        response_dict = response_data.dict()
        response_dict["batch_key"] = batch_key
        
        return response_dict
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@app.post("/extract-text")
async def extract_text_only(files: List[UploadFile] = File(...)):
    """
    Extract text only from documents (no NER processing)
    
    Args:
        files: List of uploaded files (PNG, JPG, JPEG, PDF)
        
    Returns:
        JSON response with extracted text
    """
    
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    if not ocr_processor.credentials_loaded:
        raise HTTPException(status_code=500, detail="Google Cloud Vision API not configured")
    
    results = []
    
    try:
        for file in files:
            file_content = await file.read()
            
            # Extract text based on file type
            if file.content_type == "application/pdf":
                raw_text = ocr_processor.extract_text_from_pdf(file_content)
            else:
                raw_text = ocr_processor.extract_text_from_image(file_content)
            
            if raw_text is None:
                continue
            
            # Clean and preprocess text
            cleaned_text = text_preprocessor.clean_text(raw_text)
            standardized_text = text_preprocessor.standardize_spacing(cleaned_text)
            
            result_data = {
                "filename": file.filename,
                "raw_text": raw_text,
                "cleaned_text": cleaned_text,
                "standardized_text": standardized_text
            }
            results.append(result_data)
            
            # Store individual result for download
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            storage_key = f"text_{timestamp}_{file.filename}"
            results_storage[storage_key] = result_data
        
        # Store batch results
        batch_key = f"text_batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        batch_data = {
            "success": True,
            "message": f"Successfully extracted text from {len(results)} document(s)",
            "results": results
        }
        results_storage[batch_key] = batch_data
        
        # Add batch key to response
        response = batch_data.copy()
        response["batch_key"] = batch_key
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")


@app.get("/download-results/{key}")
async def download_results_json(key: str):
    """
    Download processing results as JSON file
    
    Args:
        key: Storage key for the results (batch_key or individual file key)
        
    Returns:
        JSON file download
    """
    if key not in results_storage:
        raise HTTPException(status_code=404, detail="Results not found")
    
    results = results_storage[key]
    json_content = json.dumps(results, indent=2, ensure_ascii=False)
    
    return Response(
        content=json_content,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={key}.json"}
    )


@app.get("/download-text/{key}")
async def download_results_txt(key: str):
    """
    Download processing results as TXT file (text content only)
    
    Args:
        key: Storage key for the results
        
    Returns:
        TXT file download
    """
    if key not in results_storage:
        raise HTTPException(status_code=404, detail="Results not found")
    
    results = results_storage[key]
    txt_content = ""
    
    # Handle individual file results
    if "filename" in results:
        txt_content = f"File: {results['filename']}\n"
        txt_content += "=" * 50 + "\n\n"
        txt_content += "Raw Text:\n"
        txt_content += results.get('raw_text', '') + "\n\n"
        txt_content += "Cleaned Text:\n" 
        txt_content += results.get('standardized_text', '') + "\n"
    
    # Handle batch results
    elif "results" in results:
        for i, result in enumerate(results["results"]):
            if i > 0:
                txt_content += "\n" + "=" * 80 + "\n\n"
            
            txt_content += f"File {i+1}: {result.get('filename', 'Unknown')}\n"
            txt_content += "=" * 50 + "\n\n"
            txt_content += "Raw Text:\n"
            txt_content += result.get('raw_text', '') + "\n\n"
            txt_content += "Cleaned Text:\n"
            txt_content += result.get('standardized_text', '') + "\n"
            
            # Add entity information if available
            if 'entities' in result:
                txt_content += "\nExtracted Entities:\n"
                txt_content += "-" * 25 + "\n"
                entities = result['entities'].get('gemini', {})
                for category, items in entities.items():
                    if items:
                        txt_content += f"\n{category.replace('_', ' ').title()}:\n"
                        for item in items:
                            txt_content += f"  • {item}\n"
    
    return Response(
        content=txt_content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={key}.txt"}
    )


@app.get("/list-results")
async def list_available_results():
    """
    List all available results for download
    
    Returns:
        List of available result keys
    """
    return {
        "available_results": list(results_storage.keys()),
        "count": len(results_storage)
    }


if __name__ == "__main__":
    print("🚀 Starting FRA Document Processing API...")
    print("📄 Endpoints available:")
    print("   GET  /                         - Health check")
    print("   POST /process-documents        - Full OCR + NER processing")
    print("   POST /extract-text             - OCR text extraction only")
    print("   GET  /download-results/{key}   - Download results as JSON")
    print("   GET  /download-text/{key}      - Download results as TXT")
    print("   GET  /list-results             - List available downloads")
    print(f"\n🌐 API Documentation: http://{config.HOST}:{config.PORT}/docs")
    print("📱 Web Interface: Open index.html in your browser")
    print(f"\n⚙️  Configuration:")
    print(f"   Host: {config.HOST}")
    print(f"   Port: {config.PORT}")
    print(f"   Debug: {config.DEBUG}")
    print(f"   Credentials: {'✅ Found' if os.path.exists(config.GOOGLE_CREDENTIALS_PATH) else '❌ Not found'}")
    print(f"   Gemini API: {'✅ Configured' if config.GEMINI_API_KEY else '❌ Not configured'}")
    
    uvicorn.run(app, host=config.HOST, port=config.PORT, reload=config.DEBUG)