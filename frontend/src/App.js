import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MapView from './components/MapView';
import MapsFrame from './components/MapsFrame';
import DSS from './pages/DSS';
import OCRView from './pages/OCRView';
import About from './pages/About';

function App() {
  return (
    <Router>
      <div className="portal-layout">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapView />} />
            {/* New route for teammate's maps app iframe */}
            <Route path="/maps" element={<MapsFrame />} />
            <Route path="/dss" element={<DSS />} />
            <Route path="/ocr" element={<OCRView />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
