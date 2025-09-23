import './OCR_DSS.css';
import React, { useState, useEffect } from 'react';
import {
  FaUpload,
  FaBrain,
  FaSync
} from 'react-icons/fa';
import { OcrProvider, useOcr } from './context/OcrContext';

const API_BASE_URL = 'http://localhost:8000';

const OCR_DSS = () => {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { setOcrResults } = useOcr();

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));

  const processDocuments = async () => {
  if (files.length === 0) return setError('Please select files to process');

  const formData = new FormData();
  files.forEach(f => formData.append('files', f));

  try {
    setLoading(true);
    setError(null);

    const res = await fetch(`${API_BASE_URL}/extract-text`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      // parse raw_text to extract fields manually
      const parsedResults = data.results.map(r => {
        const text = r.raw_text;
        const extract = (label) => {
          const re = new RegExp(label + '\\s*:\\s*(.+?)(\\n|$)', 'i');
          const match = text.match(re);
          return match ? match[1].trim() : 'Not Found';
        };
        return {
          filename: r.filename,
          entities: {
            PATTA_HOLDER_NAME: [extract("Name of claimant")],
            PERSON: [extract("Father's name")],
            PLACE_NAME: [
              extract("Village"),
              extract("District"),
              extract("State")
            ],
            PATTA_NUMBER: [extract("Patta Number")],
            LAND_AREA: [extract("Area claimed")],
            CLAIM_STATUS: [extract("Claim Status")],
            DATE: [extract("Date")]
          }
        };
      });

      setResults(parsedResults);
      if (parsedResults[0]?.entities) setOcrResults(parsedResults[0].entities);
    } else {
      setError('Processing failed: ' + data.message);
    }
  } catch (err) {
    setError('API request failed: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  const getEntityIcon = (category) => {
    const icons = {
      'PERSON': '👥',
      'PATTA_HOLDER_NAME': '👤',
      'PLACE_NAME': '🏘️',
      'PATTA_NUMBER': '📄',
      'CLAIM_STATUS': '📋',
      'ORGANIZATION': '🏛️',
      'DATE': '📅',
      'LAND_AREA': '🌳'
    };
    return icons[category] || '📋';
  };

  const eligibleSchemes = [
    "PM-KISAN",
    "Pradhan Mantri Fasal Bima Yojana",
    "Soil Health Card Scheme",
    "MGNREGA",
    "PMAY-G",
    "Ayushman Bharat PM-JAY"
  ];

  const prioritySchemesByCategory = {
  "Agriculture & Farmers": [
    { name: "PM-KISAN", url: "https://pmkisan.gov.in/" },
    { name: "Pradhan Mantri Fasal Bima Yojana", url: "https://pmfby.gov.in/" },
    { name: "Soil Health Card Scheme", url: "https://soilhealth.dac.gov.in/" },
    { name: "National Agriculture Market (eNAM)", url: "https://enam.gov.in/web/" },
  ],
  "Rural Development": [
    { name: "MGNREGA", url: "https://nrega.nic.in/" },
    { name: "Pradhan Mantri Awas Yojana - Gramin", url: "https://pmayg.nic.in/" },
    { name: "Deen Dayal Upadhyaya Grameen Kaushalya Yojana", url: "https://ddugky.gov.in/" },
    { name: "Pradhan Mantri Gram Sadak Yojana", url: "https://omms.nic.in/" },
  ],
  "Health & Nutrition": [
    { name: "Ayushman Bharat PM-JAY", url: "https://pmjay.gov.in/" },
    { name: "Integrated Child Development Services (ICDS)", url: "https://icds-wcd.nic.in/" },
    { name: "POSHAN Abhiyaan", url: "https://poshanabhiyaan.gov.in/" },
  ],
  "Women & Child Welfare": [
    { name: "Pradhan Mantri Ujjwala Yojana", url: "https://www.pmuy.gov.in/" },
    { name: "Ladli Lakshmi Yojana (State)", url: "https://ladlilaxmi.mp.gov.in/" },
    { name: "Beti Bachao Beti Padhao", url: "https://wcd.nic.in/bbbp-schemes" },
  ],
  "Water & Sanitation": [
    { name: "Jal Jeevan Mission", url: "https://jaljeevanmission.gov.in/" },
    { name: "Swachh Bharat Mission", url: "https://swachhbharatmission.gov.in/" },
  ],
  "Education & Skills": [
    { name: "Skill India Mission (NSDC)", url: "https://nsdcindia.org/" },
    { name: "Pradhan Mantri Special Scholarship Scheme (PMSSS)", url: "https://aicte-india.org/bureaus/jk" },
    { name: "Mid Day Meal Scheme", url: "https://mdm.nic.in/" },
  ],
  "Social Security": [
    { name: "Pradhan Mantri Jeevan Jyoti Bima Yojana", url: "https://jansuraksha.gov.in/" },
    { name: "Pradhan Mantri Suraksha Bima Yojana", url: "https://jansuraksha.gov.in/" },
    { name: "Atal Pension Yojana", url: "https://www.npscra.nsdl.co.in/" },
    { name: "National Scholarship Portal", url: "https://scholarships.gov.in/" },
  ],
  "Energy & Livelihood": [
    { name: "PM-KUSUM (Solar Pump Scheme)", url: "https://mnre.gov.in/" },
    { name: "Pradhan Mantri Sahaj Bijli Har Ghar Yojana (Saubhagya)", url: "https://saubhagya.gov.in/" },
  ],
  "Tribal & Minorities": [
    { name: "National Scheduled Tribes Finance Development Corporation", url: "https://nstfdc.tribal.gov.in/" },
    { name: "Vanbandhu Kalyan Yojana", url: "https://tribal.nic.in/" },
    { name: "Seekho Aur Kamao (Minority Skill Development)", url: "https://www.minorityaffairs.gov.in/" },
  ],
  "Misc Development": [
    { name: "Startup India", url: "https://www.startupindia.gov.in/" },
    { name: "Stand-Up India", url: "https://www.standupmitra.in/" },
    { name: "Pradhan Mantri Mudra Yojana (PMMY)", url: "https://www.mudra.org.in/" },
    { name: "DAJGUA", url: "https://example.com/dajgua" },
  ]
};

// Load Chatbase widget once
  useEffect(() => { 
    const script = document.createElement("script");
    script.innerHTML = `(function(){
      if(!window.chatbase||window.chatbase("getState")!=="initialized"){
        window.chatbase=(...arguments)=>{
          if(!window.chatbase.q){window.chatbase.q=[]}
          window.chatbase.q.push(arguments)
        };
        window.chatbase=new Proxy(window.chatbase,{
          get(target,prop){
            if(prop==="q"){return target.q}
            return(...args)=>target(prop,...args)
          }
        })
      }
      const onLoad=function(){
        const script=document.createElement("script");
        script.src="https://www.chatbase.co/embed.min.js";
        script.id="tJyPQ3vl_y4TDId7jLfBN";  // your chatbot ID
        script.domain="www.chatbase.co";
        document.body.appendChild(script)
      };
      if(document.readyState==="complete"){onLoad()}
      else{window.addEventListener("load",onLoad)}
    })();`;
    document.body.appendChild(script);
  }, []);
  return (
    <div className="ocr-dss-container">
      {/* Upload Section */}
      <div className="upload-section">
        <h2><FaUpload /> Upload FRA Documents</h2>
        <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf" onChange={handleFileChange} />
        <button onClick={processDocuments} disabled={loading}>
          {loading ? <FaSync className="spin" /> : <FaBrain />} Process OCR & DSS
        </button>
        {error && <p className="error">{error}</p>}
      </div>

      {/* Processing Results */}
      {results?.length > 0 && (
        <div className="processing-results">
          <h3>Processing Results</h3>
          {results.map((fileResult, idx) => (
            <div key={idx} className="file-result">
              <h4>📄 {fileResult.filename}</h4>
              {fileResult.entities && Object.entries(fileResult.entities).map(([cat, items]) => (
                <div key={cat} className="entity-group">
                  <strong>{getEntityIcon(cat)} {cat.replace(/_/g,' ')}</strong>
                  <div className="entity-items">
                    {items.map((item, i) => (
                      <span key={i} className="entity-item">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* DSS Section */}
      {results?.length > 0 && (
        <div className="dss-container">
          <h2>FRA Decision Support System</h2>
          {results.map((fileResult, idx) => (
            <div key={idx} className="claimant-info">
              <p><strong>Name:</strong> {fileResult.entities?.PATTA_HOLDER_NAME?.[0] || 'Not Found'}</p>
              <p><strong>Father:</strong> {fileResult.entities?.PERSON?.[0] || 'Not Found'}</p>
              <p><strong>Village:</strong> {fileResult.entities?.PLACE_NAME?.[0] || 'Not Found'}</p>
              <p><strong>District:</strong> {fileResult.entities?.PLACE_NAME?.[1] || 'Not Found'}</p>
              <p><strong>State:</strong> {fileResult.entities?.PLACE_NAME?.[2] || 'Not Found'}</p>
              <p><strong>Land Area:</strong> {fileResult.entities?.LAND_AREA?.[0] || '0'} hectares</p>
              <p><strong>Claim Status:</strong> {fileResult.entities?.CLAIM_STATUS?.[0] || 'Pending'}</p>
            </div>
          ))}

          <div className="eligible-schemes">
            <h3>Eligible Schemes</h3>
            <ul>
              {eligibleSchemes.map((scheme, idx) => <li key={idx}>{scheme}</li>)}
            </ul>
          </div>

          <div className="priority-schemes">
  <h3>Priority Schemes</h3>
  {Object.entries(prioritySchemesByCategory).map(([category, schemes]) => (
    <div key={category} className="scheme-category">
      <h4>{category}</h4>
      <ul>
        {schemes.map((scheme, idx) => (
          <li key={idx}>
            <a href={scheme.url} target="_blank" rel="noopener noreferrer" className="priority-link">
              {scheme.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  ))}
</div>

        </div>
      )}
    </div>
  );
};

export default function OCR_DSS_Wrapper() {
  return (
    <OcrProvider>
      <OCR_DSS />
    </OcrProvider>
  );
}
