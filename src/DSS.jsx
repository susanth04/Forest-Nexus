import './DSS.css';
import React, { useEffect, useState } from "react";
import { useOcrContext } from "./context/OcrContext.js";

export default function DSS() {
  const [claimData, setClaimData] = useState(null);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const { processedData } = useOcrContext();

  // Fetch DSS data
  useEffect(() => {
    console.log("DSS useEffect triggered, processedData:", processedData);
    
    // If we have OCR results, use them to create claim data
    if (processedData) {
      const claimantData = {
        name: processedData.PATTA_HOLDER_NAME?.[0] || "Not Found",
        father: processedData.PERSON?.[0] || "Not Found",
        village: processedData.PLACE_NAME?.[0] || "Not Found",
        district: processedData.PLACE_NAME?.[1] || "Not Found",
        state: processedData.PLACE_NAME?.[2] || "Not Found",
        landArea: processedData.LAND_AREA?.[0] || "0",
        claimStatus: processedData.CLAIM_STATUS?.[0] || "Pending"
      };
      
      console.log("Sending claimant data:", claimantData);
      
      // Call backend with the extracted data
      fetch("http://127.0.0.1:8000/eligible-schemes", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(claimantData)
      })
        .then((res) => {
          console.log("Response status:", res.status);
          return res.json();
        })
        .then((data) => {
          console.log("Received data:", data);
          setClaimData(data);
        })
        .catch((err) => {
          console.error("Error fetching DSS data:", err);
          // Set fallback data in case of error
          setClaimData({
            claimant: {
              name: "Sample Claimant",
              father: "Sample Father",
              village: "Sample Village",
              district: "Sample District",
              state: "Sample State",
              landArea: "2.5",
              claimStatus: "Pending"
            },
            eligible_schemes: ["PM-KISAN", "MGNREGA", "Ayushman Bharat"]
          });
        });
    } else {
      console.log("No processed data, fetching default data");
      // Fallback to default data if no OCR results
      fetch("http://127.0.0.1:8000/eligible-schemes")
        .then((res) => {
          console.log("Default response status:", res.status);
          return res.json();
        })
        .then((data) => {
          console.log("Received default data:", data);
          setClaimData(data);
        })
        .catch((err) => {
          console.error("Error fetching default DSS data:", err);
          // Set fallback data in case of error
          setClaimData({
            claimant: {
              name: "Default Claimant",
              father: "Default Father",
              village: "Default Village",
              district: "Default District",
              state: "Default State",
              landArea: "2.5",
              claimStatus: "Pending"
            },
            eligible_schemes: ["PM-KISAN", "MGNREGA", "Ayushman Bharat"]
          });
        });
    }
  }, [processedData]);

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

  if (!claimData) return <p>Loading DSS data...</p>;

  const prioritySchemes = [
  // Agriculture & Farmers
  { id: "pmkisan", name: "PM-KISAN", url: "https://pmkisan.gov.in/" },
  { id: "pmfby", name: "Pradhan Mantri Fasal Bima Yojana", url: "https://pmfby.gov.in/" },
  { id: "soilhealth", name: "Soil Health Card Scheme", url: "https://soilhealth.dac.gov.in/" },
  { id: "eNAM", name: "National Agriculture Market (eNAM)", url: "https://enam.gov.in/web/" },

  // Rural Development
  { id: "mgnrega", name: "MGNREGA", url: "https://nrega.nic.in/" },
  { id: "pmayg", name: "Pradhan Mantri Awas Yojana - Gramin", url: "https://pmayg.nic.in/" },
  { id: "ddugky", name: "Deen Dayal Upadhyaya Grameen Kaushalya Yojana", url: "https://ddugky.gov.in/" },
  { id: "pmgsy", name: "Pradhan Mantri Gram Sadak Yojana", url: "https://omms.nic.in/" },

  // Health & Nutrition
  { id: "abpmjay", name: "Ayushman Bharat PM-JAY", url: "https://pmjay.gov.in/" },
  { id: "icds", name: "Integrated Child Development Services (ICDS)", url: "https://icds-wcd.nic.in/" },
  { id: "poshan", name: "POSHAN Abhiyaan", url: "https://poshanabhiyaan.gov.in/" },

  // Women & Child Welfare
  { id: "pmuy", name: "Pradhan Mantri Ujjwala Yojana", url: "https://www.pmuy.gov.in/" },
  { id: "ladli", name: "Ladli Lakshmi Yojana (State)", url: "https://ladlilaxmi.mp.gov.in/" },
  { id: "betibachao", name: "Beti Bachao Beti Padhao", url: "https://wcd.nic.in/bbbp-schemes" },

  // Water & Sanitation
  { id: "jaljeevan", name: "Jal Jeevan Mission", url: "https://jaljeevanmission.gov.in/" },
  { id: "swachhbharat", name: "Swachh Bharat Mission", url: "https://swachhbharatmission.gov.in/" },

  // Education & Skills
  { id: "nsdc", name: "Skill India Mission (NSDC)", url: "https://nsdcindia.org/" },
  { id: "pmsss", name: "Pradhan Mantri Special Scholarship Scheme (PMSSS)", url: "https://aicte-india.org/bureaus/jk" },
  { id: "middaymeal", name: "Mid Day Meal Scheme", url: "https://mdm.nic.in/" },

  // Social Security
  { id: "pmjjby", name: "Pradhan Mantri Jeevan Jyoti Bima Yojana", url: "https://jansuraksha.gov.in/" },
  { id: "pmsby", name: "Pradhan Mantri Suraksha Bima Yojana", url: "https://jansuraksha.gov.in/" },
  { id: "atalpension", name: "Atal Pension Yojana", url: "https://www.npscra.nsdl.co.in/" },
  { id: "nsp", name: "National Scholarship Portal", url: "https://scholarships.gov.in/" },

  // Energy & Livelihood
  { id: "kusum", name: "PM-KUSUM (Solar Pump Scheme)", url: "https://mnre.gov.in/" },
  { id: "saubhagya", name: "Pradhan Mantri Sahaj Bijli Har Ghar Yojana (Saubhagya)", url: "https://saubhagya.gov.in/" },

  // Tribal & Minorities
  { id: "nstf", name: "National Scheduled Tribes Finance Development Corporation", url: "https://nstfdc.tribal.gov.in/" },
  { id: "vanbandhu", name: "Vanbandhu Kalyan Yojana", url: "https://tribal.nic.in/" },
  { id: "seekhoaurkamai", name: "Seekho Aur Kamao (Minority Skill Development)", url: "https://www.minorityaffairs.gov.in/" },

  // Misc Development
  { id: "startupindia", name: "Startup India", url: "https://www.startupindia.gov.in/" },
  { id: "standupindia", name: "Stand-Up India", url: "https://www.standupmitra.in/" },
  { id: "mudra", name: "Pradhan Mantri Mudra Yojana (PMMY)", url: "https://www.mudra.org.in/" },
  { id: "dajgua", name: "DAJGUA", url: "https://example.com/dajgua" } // your custom placeholder
];


  return (
    <div className="container">
      {/* Header */}
      <header className="header-bar">
        <h1>ForestNexus</h1>
      </header>

      <div className="content">
        {/* Left Panel */}
        <div className="left-panel">
          <h2>FRA-based Decision Support System</h2>
          <div className="claimant-info">
            <p><strong>Claimant Name:</strong> {claimData.claimant.name}</p>
            <p><strong>Father's Name:</strong> {claimData.claimant.father}</p>
            <p><strong>Village:</strong> {claimData.claimant.village}</p>
            <p><strong>District:</strong> {claimData.claimant.district}</p>
            <p><strong>State:</strong> {claimData.claimant.state}</p>
            <p><strong>Land Area:</strong> {claimData.claimant.landArea} hectares</p>
            <p><strong>Claim Status:</strong> {claimData.claimant.claimStatus}</p>
          </div>

          <h3>Eligible Schemes</h3>
          <ul className="schemes-list">
            {claimData.eligible_schemes.map((scheme, idx) => (
              <li key={idx}>{scheme}</li>
            ))}
          </ul>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {!selectedScheme ? (
            <>
              <h3>Priority Schemes</h3>
              <div className="buttons-container">
                {prioritySchemes.map((scheme) => (
                  <button key={scheme.id} onClick={() => setSelectedScheme(scheme)}>
                    {scheme.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="scheme-details">
              <button className="back-btn" onClick={() => setSelectedScheme(null)}>← Back</button>
              <h3>{selectedScheme.name}</h3>
              <p>
                Resources:{" "}
                <a href={selectedScheme.url} target="_blank" rel="noopener noreferrer">
                  {selectedScheme.url}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
