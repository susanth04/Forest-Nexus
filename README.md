# Forest-Nexus: DSS and OCR Application

A comprehensive Decision Support System (DSS) and Optical Character Recognition (OCR) application for forest rights management and land cover analysis. This application combines geospatial data visualization, claim submission, dispute tracking, and intelligent document processing.

## 🌳 Overview

Forest-Nexus is designed to support forest rights holders and administrators in:
- **Submitting and tracking forest claims** with geospatial validation
- **Analyzing forest assets** using interactive maps and GIS data
- **Processing documents** through OCR technology for data extraction
- **Resolving disputes** with a transparent tracking system
- **Accessing resources** and FAQs for guidance

## 📁 Project Structure

```
Forest-Nexus-DSS-OCR/
├── forest-rights-app/          # Main React application
│   ├── frontend/               # React frontend application
│   │   ├── src/
│   │   │   ├── components/     # Reusable React components
│   │   │   ├── pages/          # Page components
│   │   │   │   ├── Home.js
│   │   │   │   ├── ChatBox.jsx
│   │   │   │   ├── ClaimSubmission.js
│   │   │   │   ├── DisputeTracker.js
│   │   │   │   ├── DSS.js
│   │   │   │   ├── OCR_DSS.jsx
│   │   │   │   └── ResourcesFAQ.js
│   │   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   │   ├── config/         # Firebase configuration
│   │   │   └── styles/         # CSS stylesheets
│   │   ├── public/             # Static assets & GeoJSON data
│   │   └── package.json
│   └── public/                 # Server-side assets
│       ├── geojson/            # GIS data files
│       └── data files (CSV, GeoJSON)
├── geojson/                    # GeoJSON data files
├── Visuaksie/                  # Visualization tools
│   └── visualization-app/      # Vite-based visualization app
└── package.json
```

## 🚀 Key Features

### 1. **Claim Submission & Management**
   - Submit forest rights claims with geospatial validation
   - Track claim status in real-time
   - Upload supporting documents
   - View claim history and details

### 2. **OCR & Document Processing**
   - Extract text from scanned documents
   - Automatic data validation and formatting
   - Integration with DSS for recommendations
   - Support for multiple document types

### 3. **Interactive Maps & GIS**
   - View forest assets and village boundaries
   - District and mandal-level data visualization
   - Survey area mapping
   - GeoJSON-based data layer system

### 4. **Dispute Resolution Tracker**
   - Log and track disputes
   - Monitor dispute status
   - View resolution history
   - Comment and update system

### 5. **Decision Support System (DSS)**
   - Intelligent recommendations based on claims
   - Forest cover analysis
   - Asset recommendations
   - Insights and analytics

### 6. **Resources & FAQ**
   - Comprehensive guides
   - FAQ section
   - Help documentation
   - Contact information

## 🛠️ Technology Stack

- **Frontend**: React.js, JavaScript, CSS
- **Build Tools**: Vite (for visualization-app)
- **Maps & GIS**: GeoJSON, Geospatial data
- **Authentication**: Firebase
- **Styling**: Custom CSS
- **Data**: GeoJSON, CSV, JSON

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/susanth04/Forest-Nexus.git
   cd Forest-Nexus-DSS-OCR
   ```

2. **Install dependencies for the main app**
   ```bash
   cd forest-rights-app/frontend
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the `forest-rights-app/frontend` directory:
   ```
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   The app will run at `http://localhost:3000`

### Visualization App Setup

```bash
cd Visuaksie/visualization-app
npm install
npm run dev
```

## 🗺️ GIS Data

The application includes several GeoJSON datasets:
- **Districts**: District boundary data for Warangal region
- **Mandals**: Mandal (administrative subdivision) boundaries
- **Surveys**: Survey area boundaries
- **Village Boundaries**: Individual village boundaries
- **Village Assets**: Asset information linked to villages

## 🔐 Security Notes

- **Never commit** `.env`, `.env.local`, or any secrets files
- Firebase credentials should always be kept secure
- Use `.gitignore` to exclude sensitive files (already configured)
- API keys should be managed through environment variables

## 📊 Data Sources

- `demo_claims.geojson` - Sample claim data
- `dss_recommendations.json` - Recommendation engine data
- `forest_assets.geojson` - Forest asset mapping
- `village_assets.csv` - Village-level asset data
- `warangal_villages.csv` - Village reference data

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Make your changes
3. Commit with clear messages (`git commit -m "Add feature description"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📝 License

Please add your license information here.

## 📞 Support & Contact

For support, questions, or feedback, please contact the project maintainers.

## 🔄 Development Workflow

### Available Scripts

In the frontend directory, you can run:

- `npm start` - Runs the app in development mode at http://localhost:3000
- `npm test` - Launches the test runner in interactive watch mode
- `npm run build` - Builds the app for production to the `build` folder
- `npm run eject` - Ejects from Create React App (irreversible, one-way operation)

### Project Structure Best Practices

- Keep components in `src/components/`
- Keep pages in `src/pages/`
- Store utility functions in `src/utils/`
- Maintain styles in `src/styles/`
- Use contexts for global state management

## 🐛 Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   PORT=3001 npm start
   ```

2. **Firebase connection errors**
   - Verify `.env.local` configuration
   - Check Firebase project settings
   - Ensure API keys are valid

3. **GeoJSON data not loading**
   - Verify file paths in public directory
   - Check browser console for errors
   - Ensure GeoJSON is valid JSON

## 📚 Documentation

- `FOREST_COVER_SETUP.md` - Forest cover analysis setup guide
- Check individual component files for implementation details

---

**Last Updated**: November 29, 2025  
**Repository**: https://github.com/susanth04/Forest-Nexus  
**Maintainer**: susanth04
