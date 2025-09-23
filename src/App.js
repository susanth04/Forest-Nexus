import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import DSS from "./DSS.jsx";
import OCR from "./OCR.jsx";
import { OcrProvider } from "./context/OcrContext.js";

function App() {
  return (
    <OcrProvider>
      <Router>
        <div className="App">
          {/* Navbar */}
          <nav className="navbar">
            <h2 className="logo">FRA Dashboard</h2>
            <ul className="nav-links">
              <li>
                <Link to="/">DSS</Link>
              </li>
              <li>
                <Link to="/ocr">OCR</Link>
              </li>
            </ul>
          </nav>

          {/* Page Content */}
          <div className="container">
            <Routes>
              <Route path="/" element={<DSS />} />
              <Route path="/ocr" element={<OCR />} />
            </Routes>
          </div>
        </div>
      </Router>
    </OcrProvider>
  );
}

export default App;