# 🌲 Forest Nexus DSS-OCR Application

A comprehensive web application that combines React frontend with FastAPI backend for **OCR document processing** and **Forest Rights Act (FRA) Decision Support System** functionality.

## 🚀 Features

- **📄 OCR Processing**: Extract text from images and PDF documents using Google Cloud Vision API
- **🤖 AI-Powered NER**: Named Entity Recognition using Google Gemini AI
- **🌐 Multi-language Support**: Automatic translation using Google Translate API
- **📊 Decision Support System**: FRA scheme recommendations based on extracted data
- **⚡ Real-time Processing**: Live document analysis and scheme matching
- **📱 Responsive UI**: Modern React interface with React Router navigation

## 🏗️ Project Structure

```
forest-nexus-dss-ocr/
├── 📁 src/                    # React frontend source files
│   ├── 📁 components/         # React components
│   ├── 📁 context/            # React Context API
│   ├── 📄 App.js              # Main app component
│   ├── 📄 DSS.jsx             # Decision Support System component
│   ├── 📄 OCR.jsx             # OCR processing component
│   └── 📄 index.js            # React entry point
├── 📁 backend/                # Python FastAPI backend
│   ├── 📄 main.py             # FastAPI application
│   ├── 📄 requirements.txt    # Python dependencies
│   ├── 📄 .env.example        # Environment variables template
│   └── 📄 start_backend.bat   # Windows startup script
├── 📁 public/                 # React public files
├── 📄 package.json            # Node.js dependencies & scripts
├── 📄 .gitignore             # Git ignore rules
└── 📄 README.md              # This file
```

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** - UI framework
- **React Router DOM 6** - Client-side routing
- **React Icons** - Icon components
- **CSS3** - Styling

### Backend
- **FastAPI** - Modern Python web framework
- **Google Cloud Vision API** - OCR processing
- **Google Gemini AI** - Natural Language Processing
- **Google Translate API** - Multi-language support
- **PyMuPDF** - PDF document processing
- **Uvicorn** - ASGI server

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **Google Cloud Account** with enabled APIs:
  - Cloud Vision API
  - Cloud Translate API
  - Gemini API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd forest-nexus-dss-ocr
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Set up Python environment** (recommended)
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys and configurations
   ```

5. **Add Google Cloud credentials**
   - Download your service account key JSON file
   - Place it in the `backend/` directory
   - Update the path in `backend/.env`

## 🎮 Running the Application

### Option 1: Run both frontend and backend together (Recommended)
```bash
npm run dev:full
```

### Option 2: Run separately

**Frontend only:**
```bash
npm start
# or
npm run dev
```
The React app will be available at `http://localhost:3000`

**Backend only:**
```bash
npm run backend
# or manually:
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
The API will be available at `http://localhost:8000`

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start React development server |
| `npm run dev` | Alias for `npm start` |
| `npm run backend` | Start FastAPI backend server |
| `npm run dev:full` | Start both frontend and backend |
| `npm run build` | Build production React app |
| `npm test` | Run React tests |

## 🔧 Configuration

### Environment Variables

Create `backend/.env` file with the following variables:

```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
HOST=127.0.0.1
PORT=8000
DEBUG=True

# CORS Configuration
ALLOWED_ORIGINS=*

# File Processing
MAX_FILE_SIZE_MB=10
MAX_TOTAL_SIZE_MB=50

# Translation
AUTO_TRANSLATE=True
SOURCE_LANGUAGE=te
TARGET_LANGUAGE=en
```

## 📖 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation powered by Swagger UI.

### Key Endpoints

- `POST /extract-text` - Extract text from uploaded documents
- `GET /eligible-schemes` - Get FRA scheme recommendations
- `POST /eligible-schemes` - Get personalized scheme recommendations
- `GET /health` - Health check endpoint

## 🌟 Usage Examples

### 1. Upload Document for OCR
```javascript
const formData = new FormData();
formData.append('files', selectedFile);

fetch('http://localhost:8000/extract-text', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### 2. Get Scheme Recommendations
```javascript
const claimantData = {
  name: "John Doe",
  village: "Sample Village",
  district: "Sample District"
};

fetch('http://localhost:8000/eligible-schemes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(claimantData)
})
.then(response => response.json())
.then(schemes => console.log(schemes));
```

## 🔐 Security Notes

- **Never commit sensitive files** (API keys, credentials, `.env` files)
- The `.gitignore` file is configured to exclude sensitive data
- Use environment variables for all configuration
- Rotate API keys regularly

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Frontend: The app will ask to run on a different port
   - Backend: Change the `PORT` in your `.env` file

2. **API Keys not working**
   - Verify your Google Cloud APIs are enabled
   - Check that your service account has proper permissions
   - Ensure the credentials file path is correct

3. **CORS errors**
   - Make sure `ALLOWED_ORIGINS=*` in your `.env` file
   - For production, specify exact origins

4. **Python import errors**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Activate your virtual environment if using one

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Cloud Platform for OCR and AI services
- React team for the amazing frontend framework
- FastAPI team for the modern Python web framework
- All open-source contributors

## 📞 Support

If you have any questions or issues, please:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Look through existing [Issues](../../issues)
3. Create a new issue if needed

---

**Happy coding! 🚀**

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
