# 🏛️ FRA Document OCR & AI Entity Recognition - FastAPI

A FastAPI-based REST API for processing Forest Rights Act (FRA) documents using Google Cloud Vision API for OCR and Google Gemini AI for intelligent Named Entity Recognition.

# 🏛️ FRA Document OCR & AI Entity Recognition - FastAPI

A FastAPI-based REST API for processing Forest Rights Act (FRA) documents using Google Cloud Vision API for OCR and Google Gemini AI for intelligent Named Entity Recognition.

## 🌟 Features

- **OCR Processing**: Extract text from images and PDF documents using Google Cloud Vision API
- **AI-Powered NER**: Intelligent entity extraction using Google Gemini AI
- **REST API**: Clean FastAPI endpoints with automatic documentation
- **Multi-format Support**: Process PNG, JPG, JPEG, and PDF files
- **Batch Processing**: Handle multiple documents simultaneously
- **Download Options**: Get results in both TXT and JSON formats
- **Web Interface**: Simple HTML frontend for testing
- **Comprehensive Logging**: Detailed processing logs and error handling

## 🎯 Extracted Entities

The system intelligently extracts the following entities from FRA documents:

- **👥 PERSON**: Individual names mentioned in documents
- **👤 PATTA_HOLDER_NAME**: Specific patta holder names
- **🏘️ VILLAGE**: Village names and locations  
- **📄 PATTA_NUMBER**: Patta identification numbers
- **📍 COORDINATES**: Geographic coordinates and boundaries
- **📋 CLAIM_STATUS**: Status of land claims
- **🏛️ ORGANIZATION**: Government departments and agencies
- **📅 DATES**: Important dates and deadlines
- **📊 SURVEY_NUMBERS**: Survey and plot numbers
- **🌳 LAND_DETAILS**: Land area, type, and characteristics
- **📝 MISCELLANEOUS**: Other relevant information

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Google Cloud Vision API credentials
- Google Gemini AI API key

### Installation & Setup

1. **Clone/Download the project files**

2. **Set up environment variables**:
   ```cmd
   # Copy the example environment file
   copy .env.example .env
   
   # Edit .env with your API keys
   # GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json  
   # GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Install dependencies**:
   ```cmd
   pip install -r requirements_fastapi.txt
   ```

4. **Start the server**:
   ```cmd
   python fastapi_app.py
   ```

### Manual Setup

1. **Create virtual environment**:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```cmd
   pip install -r requirements_fastapi.txt
   ```

3. **Start the server**:
   ```cmd
   python fastapi_app.py
   ```

## 📡 API Endpoints

### Health Check
```
GET /
```
Returns API health status and service availability.

### Full Document Processing
```
POST /process-documents
```
- **Input**: Multiple files (images/PDFs)
- **Output**: OCR text + AI-extracted entities + batch_key for downloads
- **Content-Type**: `multipart/form-data`

### Text Extraction Only
```
POST /extract-text
```
- **Input**: Multiple files (images/PDFs)
- **Output**: Raw and cleaned OCR text + batch_key for downloads
- **Content-Type**: `multipart/form-data`

### Download Results as JSON
```
GET /download-results/{key}
```
Download processed results as JSON files using batch_key or individual file key.

### Download Results as TXT
```
GET /download-text/{key}
```
Download processed results as human-readable TXT files.

### List Available Downloads
```
GET /list-results
```
Get a list of all available results for download.

## 🌐 Access Points

Once the server is running:

- **API Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)
- **Web Interface**: Open `index.html` in your browser

## 📥 Download Options

### JSON Format
- Complete structured data with all extracted entities
- Machine-readable format for integration with other systems
- Includes metadata like processing timestamps and file information

### TXT Format
- Human-readable text files
- Contains both raw OCR text and cleaned versions
- Includes extracted entities organized by categories
- Perfect for manual review and analysis

## 📁 Project Structure

```
OCR/
├── fastapi_app.py              # Main FastAPI application
├── requirements_fastapi.txt    # Python dependencies  
├── index.html                  # Web interface
├── README.md                   # This file
├── .env.example               # Environment variables template
├── .env.development           # Development environment (NOT for Git)
├── .gitignore                 # Git ignore file
└── credentials.json           # Google Cloud credentials (NOT in Git)
```

## ⚙️ Configuration

The application uses environment variables for configuration. Create a `.env` file from `.env.example`:

### Environment Variables
- **GOOGLE_APPLICATION_CREDENTIALS**: Path to Google Cloud credentials JSON file
- **GEMINI_API_KEY**: Your Google Gemini AI API key  
- **HOST**: Server host (default: 127.0.0.1)
- **PORT**: Server port (default: 8000)
- **DEBUG**: Enable debug mode (default: True)
- **ALLOWED_ORIGINS**: CORS allowed origins (default: *)

### Security Notes
- 🚨 **Never commit .env files or credential files to Git**
- 🔒 **API keys and credentials are excluded via .gitignore**
- ✅ **Use .env.example as a template for required variables**

### Supported File Types

- **Images**: PNG, JPG, JPEG
- **Documents**: PDF (multi-page supported)
- **Size Limit**: 10MB per file (configurable)

## 🔧 API Response Format

### Successful Processing Response
```json
{
  "success": true,
  "message": "Documents processed successfully",
  "batch_key": "batch_20250921_143025",
  "results": [
    {
      "filename": "document.pdf",
      "raw_text": "Original OCR text...",
      "standardized_text": "Cleaned text...",
      "entities": {
        "gemini": {
          "PERSON": ["John Doe", "Jane Smith"],
          "VILLAGE": ["Rampur", "Shivpuri"],
          "PATTA_NUMBER": ["12345", "67890"],
          "PATTA_HOLDER_NAME": ["Ram Kumar", "Sita Devi"]
        }
      }
    }
  ]
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure all dependencies are installed: `pip install -r requirements_fastapi.txt`
   - Check Python version: `python --version` (3.8+ required)

2. **API Key Issues**
   - Verify Google Cloud credentials file exists
   - Check Gemini API key is valid
   - Ensure APIs are enabled in Google Cloud Console

3. **File Processing Errors**
   - Check file formats are supported
   - Verify file sizes are under limits
   - Ensure files are not corrupted

4. **Server Won't Start**
   - Check if port 8000 is already in use
   - Verify virtual environment is activated
   - Check for syntax errors in `fastapi_app.py`

## 📊 Performance Notes

- **Processing Time**: 2-8 seconds per document (depending on size and complexity)
- **Concurrent Requests**: Supports multiple simultaneous requests
- **Memory Usage**: ~100-500MB depending on document sizes
- **File Limits**: 10MB per file, 50MB total per request
- **Results Storage**: In-memory storage (reset on server restart)

## 🔒 Security Considerations

- **API Keys**: Currently hardcoded (move to environment variables for production)
- **CORS**: Enabled for all origins (restrict for production)
- **File Validation**: Basic validation implemented
- **Rate Limiting**: Not implemented (consider adding for production)

---

**Version**: 2.0 (FastAPI)  
**Last Updated**: September 2025  
**Python Compatibility**: 3.8+