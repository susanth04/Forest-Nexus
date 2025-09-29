import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import { OcrProvider } from './context/OcrContext';
import Navbar from './Navbar';
import LandingPage from './LandingPage';
import OCR_DSS from './OCR_DSS';
import Claims from './Claims';
import WebGIS from './pages/WebGISDashboard';
import Login from './Login';

// Layout wrapper component
function Layout({ children }) {
  const location = useLocation();
  const hideNavbar = location.pathname === '/webgis';

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <OcrProvider>
        <Layout>
          <Routes>
            {/* WebGIS route - full screen without navbar */}
            <Route path="/webgis" element={<WebGIS />} />
            
            {/* All other routes with navbar */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/ocr-dss" element={<OCR_DSS />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/login" element={<Login />} />
            
            {/* Footer links */}
            <Route path="/about" element={<Claims />} />
            <Route path="/services" element={<Claims />} />
            <Route path="/contact" element={<Claims />} />
            <Route path="/docs" element={<Claims />} />
            <Route path="/faq" element={<Claims />} />
            <Route path="/help" element={<Claims />} />
            <Route path="/privacy" element={<Claims />} />
          </Routes>
        </Layout>
      </OcrProvider>
    </BrowserRouter>
  );
}

export default App;