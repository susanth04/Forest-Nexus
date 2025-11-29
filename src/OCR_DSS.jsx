import './OCR_DSS.css';
import React, { useState, useEffect } from 'react';
import {
  FaUpload,
  FaBrain,
  FaSync
} from 'react-icons/fa';
import { OcrProvider, useOcr } from './context/OcrContext';
import ChatBox from './ChatBox';  

const API_BASE_URL = 'http://localhost:8000';

const OCR_DSS = () => {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { setOcrResults } = useOcr();

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));

  // Fallback function to parse entities from raw text when NER fails
  const parseEntitiesFromText = (text) => {
    const entities = {};
    
    // Extract name of claimant
    const nameMatch = text.match(/Name of claimant[:\s]+([A-Za-z\s]+?)(?:\n|Father|$)/i);
    if (nameMatch) {
      entities.PATTA_HOLDER_NAME = [nameMatch[1].trim()];
    }
    
    // Extract father's name
    const fatherMatch = text.match(/Father'?s?\s*name[:\s]+([A-Za-z\s]+?)(?:\n|village|$)/i);
    if (fatherMatch) {
      entities.PERSON = [fatherMatch[1].trim()];
    }
    
    // Extract village
    const villageMatch = text.match(/village[:\s]*([A-Za-z\s]+?)(?:\n|District|$)/i);
    if (villageMatch) {
      entities.PLACE_NAME = entities.PLACE_NAME || [];
      entities.PLACE_NAME.push(villageMatch[1].trim());
    }
    
    // Extract district
    const districtMatch = text.match(/District[:\s]*\d*\s*([A-Za-z\s]+?)(?:\n|State|$)/i);
    if (districtMatch) {
      entities.PLACE_NAME = entities.PLACE_NAME || [];
      entities.PLACE_NAME.push(districtMatch[1].trim());
    }
    
    // Extract state
    const stateMatch = text.match(/State[:\s]*([A-Za-z\s]+?)(?:\n|Patta|$)/i);
    if (stateMatch) {
      entities.PLACE_NAME = entities.PLACE_NAME || [];
      entities.PLACE_NAME.push(stateMatch[1].trim());
    }
    
    // Extract patta number
    const pattaMatch = text.match(/Patta number[:\s]*([A-Z0-9-]+)/i);
    if (pattaMatch) {
      entities.PATTA_NUMBER = [pattaMatch[1].trim()];
    }
    
    // Extract area claimed
    const areaMatch = text.match(/Area claimed[:\s=]*([0-9.-]+)\s*hectares/i);
    if (areaMatch) {
      entities.LAND_AREA = [areaMatch[1].trim()];
    }
    
    // Extract claim status
    const statusMatch = text.match(/claim status[:\s]*([A-Za-z]+)/i);
    if (statusMatch) {
      entities.CLAIM_STATUS = [statusMatch[1].trim()];
    }
    
    return entities;
  };

  const processDocuments = async () => {
    if (files.length === 0) return setError('Please select files to process');

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/process-documents`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        // Process results and add fallback parsing if entities are empty
        const processedResults = data.results.map(result => {
          let entities = result.entities || {};
          
          // If entities object is empty or has no meaningful data, try fallback parsing
          if (Object.keys(entities).length === 0 || 
              !entities.PATTA_HOLDER_NAME || 
              !entities.PERSON) {
            console.log('NER failed, using fallback parsing...');
            entities = parseEntitiesFromText(result.raw_text || result.cleaned_text || result.standardized_text);
          }
          
          return {
            ...result,
            entities
          };
        });
        
        setResults(processedResults);
        if (processedResults[0]?.entities) {
          setOcrResults(processedResults[0].entities);
        }
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
        <h2 className='upload-file'><FaUpload /> Upload FRA Documents</h2>
        <input className="input-file" type="file" multiple accept=".png,.jpg,.jpeg,.pdf" onChange={handleFileChange} />
        <button className="button-process" onClick={processDocuments} disabled={loading}>
          {loading ? <FaSync className="spin" /> : <FaBrain />} Process OCR & DSS
        </button>
        {error && <p className="error">{error}</p>}
      </div>



      {/* DSS Section */}
{results?.length > 0 && (
  <div className="dss-container">
    <h2 className='fra-2'>FRA Decision Support System</h2>

    <div className="dss-content">
      {/* Left Column */}
      <div className="dss-left">
        {results.map((fileResult, idx) => (
          <div key={idx} className="claimant-info">
            <p><strong>Name:</strong> {fileResult.entities?.PATTA_HOLDER_NAME?.[0] || 'Not Found'}</p>
            <p><strong>Father:</strong> {fileResult.entities?.PERSON?.[0] || 'Not Found'}</p>
            <p><strong>Village:</strong> {fileResult.entities?.PLACE_NAME?.[0] || 'Not Found'}</p>
            <p><strong>District:</strong> {fileResult.entities?.PLACE_NAME?.[1] || 'Not Found'}</p>
            <p><strong>State:</strong> {fileResult.entities?.PLACE_NAME?.[2] || 'Not Found'}</p>
            <p><strong>Land Area:</strong> {fileResult.entities?.LAND_AREA?.[0] || '0'} hectares</p>
            <p><strong>Claim Status:</strong> {fileResult.entities?.CLAIM_STATUS?.[0] || 'Pending'}</p>
            <p><strong>Patta Number:</strong> {fileResult.entities?.PATTA_NUMBER?.[0] || 'Not Found'}</p>
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

      {/* Right Column (Chatbox) */}
      <div className="dss-right">
        <ChatBox 
          ocrContext={JSON.stringify(results[0].entities, null, 2)} 
        />
      </div>
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