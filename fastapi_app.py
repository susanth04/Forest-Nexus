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
    GOOGLE_CREDENTIALS_PATH = _creds_path if os.path.isabs(_creds_path) else os.path.join(os.path.dirname(__file__), _creds_path)
    
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
    
    # Translation settings
    AUTO_TRANSLATE = os.getenv("AUTO_TRANSLATE", "True").lower() == "true"
    SOURCE_LANGUAGE = os.getenv("SOURCE_LANGUAGE", "te")  # Telugu by default
    TARGET_LANGUAGE = os.getenv("TARGET_LANGUAGE", "en")  # English by default

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
            # Use the same service account credentials for Google Translate
            credentials_path = r"C:\Users\susan\OneDrive\Desktop\SIH-GOD\OCR\sih-2025-472809-8e136fdd6e00.json"
            
            if os.path.exists(credentials_path):
                # Create credentials with Translation API scope
                credentials = service_account.Credentials.from_service_account_file(
                    credentials_path, 
                    scopes=[
                        'https://www.googleapis.com/auth/cloud-platform',
                        'https://www.googleapis.com/auth/cloud-translation'
                    ]
                )
                # Initialize Google Translate client
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
            print("⚠️ Google Translate not available, using fallback detection")
            return self._fallback_language_detection(text)
        
        try:
            # Use Google Translate to detect language
            result = self.translate_client.detect_language(text[:1000])  # Sample first 1000 chars
            
            detected_lang = result['language']
            confidence = result['confidence']
            
            print(f"🔍 Google Translate detected: {detected_lang} (confidence: {confidence:.2f})")
            
            return {
                'language': detected_lang,
                'confidence': confidence
            }
            
        except Exception as e:
            print(f"Language detection error: {str(e)}")
            return self._fallback_language_detection(text)
    
    def _fallback_language_detection(self, text):
        """Enhanced fallback language detection for ANY language using comprehensive Unicode analysis"""
        language_ranges = {
            'hi': [(0x0900, 0x097F)],  # Devanagari (Hindi, Sanskrit, Marathi)
            'bn': [(0x0980, 0x09FF)],  # Bengali/Assamese
            'pa': [(0x0A00, 0x0A7F)],  # Gurmukhi (Punjabi)
            'gu': [(0x0A80, 0x0AFF)],  # Gujarati
            'or': [(0x0B00, 0x0B7F)],  # Oriya
            'ta': [(0x0B80, 0x0BFF)],  # Tamil
            'te': [(0x0C00, 0x0C7F)],  # Telugu
            'kn': [(0x0C80, 0x0CFF)],  # Kannada
            'ml': [(0x0D00, 0x0D7F)],  # Malayalam
            'ar': [(0x0600, 0x06FF)],  # Arabic
            'zh': [(0x4E00, 0x9FFF)],  # Chinese (CJK Ideographs)
            'ja': [(0x3040, 0x309F), (0x30A0, 0x30FF)],  # Japanese (Hiragana + Katakana)
            'ko': [(0xAC00, 0xD7AF)],  # Korean (Hangul)
            'ru': [(0x0400, 0x04FF)],  # Cyrillic (Russian, etc.)
            'el': [(0x0370, 0x03FF)],  # Greek
            'th': [(0x0E00, 0x0E7F)],  # Thai
            'my': [(0x1000, 0x109F)],  # Myanmar
            'km': [(0x1780, 0x17FF)],  # Khmer (Cambodian)
            'lo': [(0x0E80, 0x0EFF)],  # Lao
            'si': [(0x0D80, 0x0DFF)],  # Sinhala
            'am': [(0x1200, 0x137F)],  # Ethiopic (Amharic)
            'he': [(0x0590, 0x05FF)],  # Hebrew
        }
        
        char_counts = {}
        total_chars = 0
        
        # Sample first 1000 chars for efficiency
        sample_text = text[:1000] if len(text) > 1000 else text
        
        for char in sample_text:
            if char.isalpha():
                total_chars += 1
                char_code = ord(char)
                
                # Check which language this character belongs to
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
            # Find the language with most characters
            most_common_lang = max(char_counts, key=char_counts.get)
            confidence = char_counts[most_common_lang] / total_chars
            
            if confidence > 0.1:  # At least 10% of characters from non-English script
                print(f"🔍 Detected language: {most_common_lang} (confidence: {confidence:.2f})")
                return {
                    'language': most_common_lang,
                    'confidence': confidence
                }
        
        return {'language': 'en', 'confidence': 0.0}
    
    def translate_with_google(self, text, target_language='en'):
        """Translate text using Google Translate API with enhanced name preservation"""
        if not self.translate_client:
            print("⚠️ Google Translate not available")
            return text
        
        try:
            # First detect the language
            detection = self.detect_language(text)
            source_lang = detection['language']
            
            # If already in target language, return as-is
            if source_lang == target_language or source_lang == 'en':
                print(f"✅ Text already in target language ({source_lang})")
                return text
            
            # Enhanced translation with proper name handling
            # Split text into smaller chunks for better accuracy
            chunks = self._split_text_intelligently(text)
            translated_chunks = []
            
            for chunk in chunks:
                if len(chunk.strip()) == 0:
                    translated_chunks.append(chunk)
                    continue
                
                # Translate chunk using Google Translate
                result = self.translate_client.translate(
                    chunk,
                    target_language=target_language,
                    source_language=source_lang if source_lang != 'unknown' else None,
                    format_='text'
                )
                
                translated_chunk = result['translatedText']
                translated_chunks.append(translated_chunk)
            
            # Combine translated chunks
            translated_text = ''.join(translated_chunks)
            
            # Post-process to fix common translation issues
            translated_text = self._post_process_translation(translated_text, text)
            
            print(f"🌐 Google Translate: {source_lang} → {target_language}")
            print(f"📝 Original: {text[:100]}...")
            print(f"📝 Translated: {translated_text[:100]}...")
            
            return translated_text
            
        except Exception as e:
            print(f"Google Translate error: {str(e)}")
            return text
    
    def _split_text_intelligently(self, text, max_chunk_size=1000):
        """Split text into smaller chunks while preserving sentence boundaries"""
        if len(text) <= max_chunk_size:
            return [text]
        
        chunks = []
        current_chunk = ""
        
        # Split by sentences (look for common Telugu sentence endings)
        sentences = re.split(r'([।\.\?!]\s*)', text)
        
        for sentence in sentences:
            if len(current_chunk + sentence) <= max_chunk_size:
                current_chunk += sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = sentence
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks
    
    def _post_process_translation(self, translated_text, original_text):
        """Post-process translated text to improve accuracy for ANY language"""
        processed_text = translated_text
        
        # Universal number and code preservation
        patterns_to_preserve = [
            r'[A-Z]{2,}-\d+',           # PAT-000123, REG-001
            r'\d{2}-\d{2}-\d{4}',       # DD-MM-YYYY dates
            r'\d{1,2}/\d{1,2}/\d{4}',   # DD/MM/YYYY dates
            r'\d+\.\d+\s*[A-Z]',        # 19.6354 N (coordinates)
            r'\d+\.\d+',                # Decimal numbers
            r'\d+/\d+',                 # Survey numbers like 45/2
            r'\+91\d{10}',              # Indian phone numbers
            r'\d{4}\s*\d{6}',           # Phone numbers
            r'[A-Z]{2}\d{2}[A-Z]{2}\d{4}[A-Z]\d[A-Z]\d[A-Z]'  # Aadhaar-like patterns
        ]
        
        # Preserve all these patterns from original text
        for pattern in patterns_to_preserve:
            original_matches = re.findall(pattern, original_text)
            for match in original_matches:
                if match not in processed_text:
                    # Try to find similar corrupted pattern and replace
                    # Look for partial matches that might have been mistranslated
                    for i, char in enumerate(match):
                        if char.isdigit():
                            # Find digit patterns in translated text and check if they should be this match
                            digit_patterns = re.findall(r'\d+', processed_text)
                            for dp in digit_patterns:
                                if dp in match:
                                    processed_text = processed_text.replace(dp, match, 1)
                                    break
                            break
        
        # Fix common translation errors for different languages
        common_fixes = {
            # Hindi/Devanagari transliterations
            'Shri ': 'Sri ',
            'Shreemati ': 'Srimati ',
            # Telugu transliterations  
            'Sree ': 'Sri ',
            'Amma ': 'Amma',
            # Tamil transliterations
            'Thiru ': 'Thiru ',
            # Universal fixes
            'D/O ': 'D/o ',
            'S/O ': 'S/o ',
            'W/O ': 'W/o ',
            'Village ': 'Village: ',
            'District ': 'District: ',
        }
        
        for wrong, correct in common_fixes.items():
            processed_text = processed_text.replace(wrong, correct)
        
        return processed_text
    
    def _clean_entities_to_english(self, entities):
        """Clean entity values to ensure they're in English with enhanced accuracy"""
        cleaned_entities = {}
        
        # Telugu-English name dictionary for better accuracy
        telugu_names = {
            'రమేష్': 'Ramesh', 'రమేశ్': 'Ramesh',
            'సోహన్': 'Sohan', 'సోహాన్': 'Sohan', 
            'కృష్ణ': 'Krishna', 'కృష్ణా': 'Krishna',
            'రాధ': 'Radha', 'గీత': 'Geetha',
            'సుధా': 'Sudha', 'రమ': 'Rama',
            'లక్ష్మీ': 'Lakshmi', 'సరస్వతీ': 'Saraswati'
        }
        
        telugu_places = {
            'కోతపల్లి': 'Kotapalli', 'ఆదిలాబాద్': 'Adilabad',
            'తెలంగాణ': 'Telangana', 'హైదరాబాద్': 'Hyderabad',
            'వరంగల్': 'Warangal', 'నిజామాబాద్': 'Nizamabad'
        }
        
        # Telugu status terms
        claim_status_mapping = {
            'మంజూరైంది': 'Approved',
            'మంజూర్': 'Approved', 
            'పెండింగ్': 'Pending',
            'వేచిఉన్న': 'Pending',
            'తిరస్కరించబడింది': 'Rejected',
            'తిరస్కరణ': 'Rejected',
            'ధృవీకరించబడింది': 'Verified',
            'ధృవీకరణ': 'Verified',
            'ప్రక్రియలో': 'Under Process',
            'పరిశీలనలో': 'Under Review'
        }
        
        for entity_type, items in entities.items():
            if not items:
                continue
                
            cleaned_items = []
            for item in items:
                item_str = str(item).strip()
                
                # Skip empty items
                if not item_str:
                    continue
                
                # Apply domain-specific processing
                processed_item = self._apply_domain_knowledge(item_str, entity_type, telugu_names, telugu_places, claim_status_mapping)
                
                # Check if item contains non-English characters
                if self._contains_non_english_chars(processed_item):
                    print(f"⚠️ Found non-English text in {entity_type}: {processed_item}")
                    # Try to translate this specific item
                    translated_item = self._translate_single_item(processed_item)
                    if translated_item and translated_item != processed_item:
                        final_item = self._standardize_entity(translated_item, entity_type)
                        cleaned_items.append(final_item)
                        print(f"✅ Translated: {processed_item} → {final_item}")
                    else:
                        # Keep original if translation fails, but warn
                        print(f"⚠️ Could not translate: {processed_item}")
                        cleaned_items.append(processed_item)
                else:
                    # Item is already in English, but still standardize
                    final_item = self._standardize_entity(processed_item, entity_type)
                    cleaned_items.append(final_item)
            
            # Filter out duplicates and low-quality entries
            if cleaned_items:
                filtered_items = self._filter_high_quality_entities(cleaned_items, entity_type)
                if filtered_items:
                    cleaned_entities[entity_type] = filtered_items
        
        return cleaned_entities
    
    def _apply_domain_knowledge(self, text, entity_type, telugu_names, telugu_places, claim_status_mapping):
        """Apply FRA document domain knowledge for better accuracy"""
        # Direct Telugu to English mapping
        if entity_type in ['PERSON', 'PATTA_HOLDER_NAME']:
            for telugu, english in telugu_names.items():
                if telugu in text:
                    text = text.replace(telugu, english)
        
        elif entity_type == 'PLACE_NAME':
            for telugu, english in telugu_places.items():
                if telugu in text:
                    text = text.replace(telugu, english)
        
        elif entity_type == 'CLAIM_STATUS':
            # Special handling for claim status
            for telugu, english in claim_status_mapping.items():
                if telugu in text:
                    text = text.replace(telugu, english)
                    break  # Stop after first match
            
            # Additional processing for claim status
            text_lower = text.lower()
            if any(word in text_lower for word in ['approved', 'granted', 'accepted']):
                return 'Approved'
            elif any(word in text_lower for word in ['pending', 'waiting', 'under process']):
                return 'Pending'
            elif any(word in text_lower for word in ['rejected', 'denied', 'cancelled']):
                return 'Rejected'
            elif any(word in text_lower for word in ['verified', 'confirmed']):
                return 'Verified'
        
        return text
    
    def _standardize_entity(self, text, entity_type):
        """Standardize entity format based on type"""
        if entity_type in ['PERSON', 'PATTA_HOLDER_NAME']:
            # Standardize name format (Title Case)
            return ' '.join(word.capitalize() for word in text.split())
        
        elif entity_type == 'PLACE_NAME':
            # Standardize place names
            return ' '.join(word.capitalize() for word in text.split())
        
        elif entity_type == 'PATTA_NUMBER':
            # Ensure proper patta number format
            import re
            # Look for PAT-XXXXXX pattern
            patta_pattern = r'(PAT[-\s]*\d+)'
            match = re.search(patta_pattern, text.upper())
            if match:
                return match.group(1).replace(' ', '-')
            # Return as-is if no pattern found
            return text.upper()
        
        elif entity_type == 'CLAIM_STATUS':
            # Standardize claim status
            status_mapping = {
                'APPROVED': 'Approved',
                'PENDING': 'Pending', 
                'REJECTED': 'Rejected',
                'VERIFIED': 'Verified',
                'UNDER PROCESS': 'Under Process',
                'UNDER REVIEW': 'Under Review'
            }
            return status_mapping.get(text.upper(), text.title())
        
        elif entity_type == 'COORDINATES':
            # Ensure proper coordinate format
            import re
            coord_pattern = r'(\d+\.?\d*)\s*([NS]),?\s*(\d+\.?\d*)\s*([EW])'
            match = re.search(coord_pattern, text)
            if match:
                return f"{match.group(1)} {match.group(2)}, {match.group(3)} {match.group(4)}"
        
        elif entity_type == 'DATE':
            # Standardize date format
            import re
            date_patterns = [
                (r'(\d{1,2})-(\d{1,2})-(\d{4})', r'\1-\2-\3'),
                (r'(\d{1,2})/(\d{1,2})/(\d{4})', r'\1/\2/\3')
            ]
            for pattern, replacement in date_patterns:
                text = re.sub(pattern, replacement, text)
        
        return text
    
    def _filter_high_quality_entities(self, items, entity_type):
        """Filter entities based on quality and confidence"""
        filtered = []
        
        for item in items:
            # Skip very short items (likely errors)
            if len(item.strip()) < 2:
                continue
            
            # Skip items that are just punctuation or numbers (unless appropriate)
            if entity_type in ['PERSON', 'PLACE_NAME', 'ORGANIZATION'] and not any(c.isalpha() for c in item):
                continue
            
            # Skip obvious extraction errors
            if item.lower() in ['none', 'null', 'undefined', 'n/a', 'not found']:
                continue
            
            filtered.append(item)
        
        return filtered
    
    def _contains_non_english_chars(self, text):
        """Check if text contains non-English characters"""
        for char in text:
            char_code = ord(char)
            # Check for common non-English Unicode ranges
            if ((char_code >= 0x0900 and char_code <= 0x097F) or  # Devanagari
                (char_code >= 0x0980 and char_code <= 0x09FF) or  # Bengali
                (char_code >= 0x0A00 and char_code <= 0x0A7F) or  # Gurmukhi
                (char_code >= 0x0A80 and char_code <= 0x0AFF) or  # Gujarati
                (char_code >= 0x0B00 and char_code <= 0x0B7F) or  # Oriya
                (char_code >= 0x0B80 and char_code <= 0x0BFF) or  # Tamil
                (char_code >= 0x0C00 and char_code <= 0x0C7F) or  # Telugu
                (char_code >= 0x0C80 and char_code <= 0x0CFF) or  # Kannada
                (char_code >= 0x0D00 and char_code <= 0x0D7F)):   # Malayalam
                return True
        return False
    
    def _translate_single_item(self, text):
        """Translate a single entity item using Google Translate"""
        if not self.translate_client:
            return text
            
        try:
            result = self.translate_client.translate(text, target_language='en')
            return result['translatedText'].strip()
        except Exception as e:
            print(f"Failed to translate single item '{text}': {e}")
            return text
    
    def translate_with_gemini_ner(self, text, target_language='en'):
        """Use Gemini for intelligent translation + entity extraction"""
        if not hasattr(ner_extractor, 'gemini_model') or not ner_extractor.gemini_model:
            print("⚠️ Gemini model not available, falling back to Google Translate only")
            return self.translate_with_google(text, target_language)
        
        try:
            prompt = f"""
You are an expert specialist in Indian Forest Rights Act (FRA) documents with deep knowledge of Telugu naming conventions and government document structures.

DOCUMENT TYPE: Forest Rights Act Individual Land Title Application (2006 Act)
LANGUAGE CONTEXT: This is a Telugu government document with standardized format.

ORIGINAL TEXT:
{text}

TRANSLATION & EXTRACTION TASK:
1. COMPLETE English translation - NO Telugu script in output
2. Extract entities with MAXIMUM ACCURACY using domain knowledge

DOMAIN-SPECIFIC KNOWLEDGE:
- పట్టా (Patta) = Land Title/Revenue Record
- పట్టాదారుడు (Pattadhaarudu) = Patta Holder/Land Title Holder
- సర్వే సంఖ్య (Survey Number) = Plot identification number  
- దరఖాస్తుదారుడు (Applicant) = Person applying for rights
- దావా స్థితి (Claim Status) = Application status
- గ్రామ అటవీ హక్కుల కమిటీ = Village Forest Rights Committee
- Common Telugu Names: రమేష్→Ramesh, సోహన్→Sohan, కృష్ణ→Krishna
- Places: కోతపల్లి→Kotapalli, ఆదిలాబాద్→Adilabad, తెలంగాణ→Telangana
- Status Terms: మంజూరైంది→Approved, పెండింగ్→Pending, తిరస్కరించబడింది→Rejected, ధృవీకరించబడింది→Verified

ACCURACY REQUIREMENTS:
- PATTA_HOLDER_NAME: Primary landowner/applicant name (main beneficiary)
- PATTA_NUMBER: Exact alphanumeric codes (PAT-XXXXXX format)
- CLAIM_STATUS: Status like "మంజూరైంది"→"Approved", "పెండింగ్"→"Pending", "తిరస్కరించబడింది"→"Rejected"
- PERSON: Extract full names correctly (handle father's name patterns like "S/o", "D/o")
- PLACE_NAME: Include village, mandal/tehsil, district, state hierarchy  
- COORDINATES: Preserve exact GPS format (degrees with N/S, E/W)
- DATES: Convert Telugu date format to DD-MM-YYYY or MM/DD/YYYY
- LAND_AREA: Convert hectares/acres accurately with units

RESPONSE FORMAT - EXACT JSON:
{{
    "translated_text": "Complete professional English translation",
    "original_language": "te",
    "entities": {{
        "PATTA_HOLDER_NAME": ["Primary landowner/main applicant name"],
        "PATTA_NUMBER": ["PAT-XXXXXX", "Land title numbers"],
        "CLAIM_STATUS": ["Approved", "Pending", "Rejected", "Under Process", "Verified"],
        "PERSON": ["Other person names including family members"],
        "PLACE_NAME": ["Village name", "Mandal/Tehsil", "District", "State"],
        "ORGANIZATION": ["Village Forest Rights Committee", "Forest Department"],
        "COORDINATES": ["XX.XXXX N, XX.XXXX E"],
        "DATE": ["DD-MM-YYYY format"],
        "LAND_AREA": ["X.X hectares", "X.X acres"],
        "SURVEY_NUMBER": ["Survey plot numbers"],
        "ADDRESS": ["Complete address if available"],
        "PHONE_NUMBER": ["Contact numbers"],
        "EMAIL": ["Email addresses"]
    }},
    "confidence": 0.98
}}

CRITICAL: All entities must be in perfect English. Use your FRA document expertise for maximum accuracy.
"""
            
            print("🤖 Using Gemini for intelligent translation + NER extraction...")
            response = ner_extractor.gemini_model.generate_content(prompt)
            
            if response and response.text:
                result_text = response.text.strip()
                
                # Clean up the response
                if result_text.startswith("```json"):
                    result_text = result_text.replace("```json", "").replace("```", "").strip()
                
                try:
                    result = json.loads(result_text)
                    translated_text = result.get('translated_text', text)
                    entities = result.get('entities', {})
                    original_lang = result.get('original_language', 'unknown')
                    
                    # Post-process entities to ensure they're in English
                    cleaned_entities = self._clean_entities_to_english(entities)
                    
                    print(f"🌐 Gemini Translation: {original_lang} → en")
                    print(f"📝 Entities found: {sum(len(v) for v in cleaned_entities.values())} total")
                    
                    return {
                        'translated_text': translated_text,
                        'entities': cleaned_entities,
                        'original_language': original_lang
                    }
                    
                except json.JSONDecodeError as e:
                    print(f"❌ Gemini JSON parse error: {e}")
                    print(f"Raw response: {result_text[:200]}...")
                    # Fallback to Google Translate
                    return {
                        'translated_text': self.translate_with_google(text, target_language),
                        'entities': {},
                        'original_language': 'unknown'
                    }
            
            print("⚠️ No response from Gemini, using Google Translate fallback")
            return {
                'translated_text': self.translate_with_google(text, target_language),
                'entities': {},
                'original_language': 'unknown'
            }
            
        except Exception as e:
            print(f"❌ Gemini translation+NER failed: {str(e)}")
            return {
                'translated_text': self.translate_with_google(text, target_language),
                'entities': {},
                'original_language': 'unknown'
            }
    
    def should_translate(self, text):
        """Determine if text needs translation"""
        if not config.AUTO_TRANSLATE:
            return False
        
        detection = self.detect_language(text)
        if detection and detection.get('language') == 'te':
            confidence = detection.get('confidence', 0)
            print(f"Detected Telugu text (confidence: {confidence:.2f})")
            return confidence > 0.1  # If more than 10% Telugu characters
        
        return False


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
        """Extract entities using Google Gemini API - Universal multilingual support"""
        if not self.gemini_model or not text:
            return {}
        
        try:
            # Enhanced multilingual prompt for universal accuracy
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
                print(f"Raw response: {response.text[:200]}...")
                return {}
                
        except Exception as e:
            print(f"Gemini NER extraction failed: {str(e)}")
            return {}
    
    def extract_all_entities(self, text):
        """Extract entities using Gemini API"""
        # Only use Gemini for entity extraction
        if self.gemini_model:
            gemini_entities = self.extract_entities_gemini(text)
            # Return entities directly, not wrapped in a "gemini" key
            return gemini_entities if isinstance(gemini_entities, dict) else {}
        else:
            print("⚠️ Gemini API not available. No entity extraction will be performed.")
            return {}


# Global instances
ocr_processor = OCRProcessor(config.GOOGLE_CREDENTIALS_PATH)
text_preprocessor = TextPreprocessor()
ner_extractor = NERExtractor()
translation_service = TranslationService()  # No credentials needed - uses Gemini


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
        
        # Test translation with a simple phrase
        test_text = "Hello"
        test_result = translation_service.translate_with_google(test_text, 'hi')  # Translate to Hindi
        
        # Get supported languages count (basic test)
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
            print(f"\n📄 Processing file: {file.filename}")
            
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
            
            # Use hybrid translation + NER approach
            translated_text = standardized_text
            original_language = "Unknown"
            gemini_entities = {}
            
            if translation_service.should_translate(standardized_text):
                print("🚀 Using hybrid Gemini + Google Translate approach...")
                
                # First try Gemini for intelligent translation + NER
                gemini_result = translation_service.translate_with_gemini_ner(standardized_text, 'en')
                
                if gemini_result and gemini_result.get('translated_text'):
                    translated_text = gemini_result['translated_text']
                    gemini_entities = gemini_result.get('entities', {})
                    original_language = gemini_result.get('original_language', 'Unknown')
                    print("✅ Gemini translation + NER completed")
                    print(f"🔍 Gemini found {sum(len(v) for v in gemini_entities.values())} entities")
                else:
                    # Fallback to Google Translate only
                    detection = translation_service.detect_language(standardized_text)
                    if detection:
                        original_language = detection.get('language', 'Unknown')
                        print("🌐 Fallback: Using Google Translate only...")
                        translated_text = translation_service.translate_with_google(standardized_text, 'en')
                        print("✅ Google Translate completed")
            
            # Extract entities from translated text using traditional NER
            try:
                traditional_entities = ner_extractor.extract_all_entities(translated_text)
                print(f"🔍 Traditional NER found: {sum(len(v) for v in traditional_entities.values())} entities")
            except Exception as e:
                print(f"⚠️ Traditional NER failed: {str(e)}")
                traditional_entities = {}
            
            # Merge entities from both Gemini and traditional NER
            try:
                final_entities = {}
                all_entity_types = set(list(gemini_entities.keys()) + list(traditional_entities.keys()))

                # Always include these key fields, even if empty
                required_fields = ["CLAIM_STATUS", "PATTA_HOLDER_NAME", "PATTA_NUMBER"]
                for req_field in required_fields:
                    all_entity_types.add(req_field)

                print(f"🔄 Merging entity types: {list(all_entity_types)}")

                for entity_type in all_entity_types:
                    # Skip non-entity keys that might have been added accidentally
                    if entity_type.lower() in ['gemini', 'confidence', 'translated_text', 'original_language']:
                        print(f"⚠️ Skipping invalid entity type: {entity_type}")
                        continue

                    gemini_items = gemini_entities.get(entity_type, [])
                    traditional_items = traditional_entities.get(entity_type, [])

                    # Ensure items are properly formatted
                    clean_gemini = []
                    if isinstance(gemini_items, list):
                        clean_gemini = [str(item).strip() for item in gemini_items if item and str(item).strip()]
                    elif gemini_items:
                        clean_gemini = [str(gemini_items).strip()]

                    clean_traditional = []
                    if isinstance(traditional_items, list):
                        clean_traditional = [str(item).strip() for item in traditional_items if item and str(item).strip()]
                    elif traditional_items:
                        clean_traditional = [str(traditional_items).strip()]

                    # Combine and deduplicate
                    combined_items = list(set(clean_gemini + clean_traditional))
                    # Always include required fields, even if empty
                    if entity_type in required_fields:
                        final_entities[entity_type] = combined_items if combined_items else []
                        print(f"  📋 {entity_type}: {len(combined_items)} items - {combined_items[:3]}{'...' if len(combined_items) > 3 else ''}")
                    elif combined_items:
                        final_entities[entity_type] = combined_items
                        print(f"  📋 {entity_type}: {len(combined_items)} items - {combined_items[:3]}{'...' if len(combined_items) > 3 else ''}")

                # Guarantee all required fields are present, even if empty
                for req_field in required_fields:
                    if req_field not in final_entities:
                        final_entities[req_field] = []

                print(f"🔗 Final merged entities: {sum(len(v) for v in final_entities.values())} total")

            except Exception as e:
                print(f"❌ Entity merging failed: {str(e)}")
                # Use Gemini entities as fallback, but guarantee required fields
                final_entities = gemini_entities if gemini_entities else traditional_entities
                for req_field in ["CLAIM_STATUS", "PATTA_HOLDER_NAME", "PATTA_NUMBER"]:
                    if req_field not in final_entities:
                        final_entities[req_field] = []
            
            # Make results JSON serializable with error handling
            try:
                serializable_entities = make_json_serializable(final_entities)
                print("✅ Entity serialization successful")
                print(f"🔍 Final entity keys: {list(serializable_entities.keys())}")
                # Print sample of entities for debugging
                for key, values in serializable_entities.items():
                    if values:
                        print(f"  {key}: {values[:2]}{'...' if len(values) > 2 else ''}")
                        
            except Exception as e:
                print(f"❌ Serialization failed: {str(e)}")
                # Create a safe fallback
                serializable_entities = {k: [str(v) for v in (val if isinstance(val, list) else [val])] 
                                       for k, val in final_entities.items() if val}
            
            # Create processing result with error handling
            try:
                result = ProcessingResult(
                    filename=file.filename,
                    raw_text=raw_text,
                    cleaned_text=cleaned_text,
                    standardized_text=standardized_text,
                    translated_text=translated_text,
                    original_language=original_language,
                    entities=serializable_entities
                )
                print(f"✅ ProcessingResult created for {file.filename}")
                results.append(result)
                
            except Exception as e:
                print(f"❌ ProcessingResult creation failed: {str(e)}")
                # Create a minimal result as fallback
                try:
                    result = ProcessingResult(
                        filename=file.filename or "unknown",
                        raw_text=raw_text or "",
                        cleaned_text=cleaned_text or "",
                        standardized_text=standardized_text or "",
                        translated_text=translated_text or "",
                        original_language=original_language or "unknown",
                        entities=serializable_entities or {}
                    )
                    results.append(result)
                    print("✅ Fallback ProcessingResult created")
                except Exception as e2:
                    print(f"❌ Even fallback failed: {str(e2)}")
                    # Skip this file and continue with others
                    continue
            
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
        error_msg = f"Processing failed: {str(e)}"
        print(f"❌ Main processing error: {error_msg}")
        
        # Return a proper error response structure that frontend can handle
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": error_msg,
                "results": [],  # Ensure results is always an array
                "error_details": str(e)
            }
        )


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
    print("   GET  /health/translation       - Translation API health check")
    print("   POST /process-documents        - Full OCR + NER processing")
    print("   POST /extract-text             - OCR text extraction only")
    print("   GET  /download-results/{key}   - Download results as JSON")
    print("   GET  /download-text/{key}      - Download results as TXT")
    print("   GET  /list-results             - List available downloads")
    print(f"\n🌐 API Documentation: http://{config.HOST}:{config.PORT}/docs")
    print("📱 Web Interface: Open index.html in your browser")
    print("\n⚙️  Configuration:")
    print(f"   Host: {config.HOST}")
    print(f"   Port: {config.PORT}")
    print(f"   Debug: {config.DEBUG}")
    print(f"   Credentials: {'✅ Found' if os.path.exists(config.GOOGLE_CREDENTIALS_PATH) else '❌ Not found'}")
    print(f"   Gemini API: {'✅ Configured' if config.GEMINI_API_KEY else '❌ Not configured'}")
    
    if config.DEBUG:
        # For development with reload
        uvicorn.run("fastapi_app:app", host=config.HOST, port=config.PORT, reload=True)
    else:
        # For production without reload
        uvicorn.run(app, host=config.HOST, port=config.PORT)