import './OCR.css';
import React, { useState, useEffect } from 'react';
import {
  FaUpload,
  FaFileAlt,
  FaBrain,
  FaHeart,
  FaDownload,
  FaList,
  FaSync
} from 'react-icons/fa';

const OCR = () => {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [availableResults, setAvailableResults] = useState([]); // State for available results

  const API_BASE_URL = 'http://localhost:8000';

  // Check API health on component mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      const data = await response.json();
      setApiHealth(data);
    } catch (error) {
      setError(`Health check failed: ${error.message}`);
    }
  };

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
    setError(null);
  };

  const processDocuments = async () => {
    if (files.length === 0) {
      setError('Please select files to process');
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/process-documents`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      console.log('Received data:', data);
      if (data.success) {
        const resultData = {
          type: 'full',
          data: data.results,
          batchKey: data.batch_key
        };
        console.log('Setting results:', resultData);
        setResults(resultData);
      } else {
        console.error('Processing failed:', data.message);
        setError(`Processing failed: ${data.message}`);
      }
    } catch (error) {
      setError(`Request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const extractTextOnly = async () => {
    if (files.length === 0) {
      setError('Please select files to process');
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/extract-text`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResults({
          type: 'text',
          data: data.results,
          batchKey: data.batch_key
        });
      } else {
        setError(`Text extraction failed: ${data.message}`);
      }
    } catch (error) {
      setError(`Request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const listAvailableResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/list-results`);
      const data = await response.json();
      setAvailableResults(data.available_results || []);
      setResults({
        type: 'list',
        data: data
      });
    } catch (error) {
      setError(`Failed to fetch available results: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getEligibleSchemes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/eligible-schemes`);
      const data = await response.json();
      setResults({
        type: 'schemes',
        data: data
      });
    } catch (error) {
      setError(`Failed to fetch schemes: ${error.message}`);
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
      'COORDINATES': '📍',
      'CLAIM_STATUS': '📋',
      'ORGANIZATION': '🏛️',
      'DATE': '📅',
      'SURVEY_NUMBER': '📊',
      'LAND_AREA': '🌳',
      'ADDRESS': '📍',
      'PHONE_NUMBER': '📞',
      'EMAIL': '📧'
    };
    return icons[category] || '📋';
  };

  const HealthIndicator = () => {
    if (!apiHealth) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FaHeart className="w-5 h-5 text-red-500" />
          API Health Status
        </h3>
        <div className="space-y-2">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            apiHealth.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {apiHealth.status.toUpperCase()}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className={`text-sm ${apiHealth.gemini_available ? 'text-green-600' : 'text-red-600'}`}>
              Gemini AI: {apiHealth.gemini_available ? '✅ Available' : '❌ Not Available'}
            </div>
            <div className={`text-sm ${apiHealth.vision_api_available ? 'text-green-600' : 'text-red-600'}`}>
              Vision API: {apiHealth.vision_api_available ? '✅ Available' : '❌ Not Available'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ProcessingResults = ({ results }) => {
    if (!results || !results.data) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FaBrain className="w-5 h-5 text-purple-600" />
          Processing Results
        </h3>
        
        {results.batchKey && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
            <h4 className="font-medium text-green-800 mb-2">📥 Download All Results</h4>
            <div className="flex gap-2">
              <a
                href={`${API_BASE_URL}/download-results/${results.batchKey}`}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                download
              >
                <FaDownload className="w-4 h-4 mr-1" />
                JSON
              </a>
              <a
                href={`${API_BASE_URL}/download-text/${results.batchKey}`}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                download
              >
                <FaFileAlt className="w-4 h-4 mr-1" />
                TXT
              </a>
            </div>
          </div>
        )}

        {Array.isArray(results.data) && results.data.map((result, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold mb-3">📄 {result.filename}</h4>
            
            {result.original_language && result.original_language !== "Unknown" && (
              <div className="text-sm text-gray-600 mb-2">
                Original Language: {result.original_language}
              </div>
            )}

            {result.entities && Object.entries(result.entities).map(([category, items]) => {
              if (items && items.length > 0) {
                return (
                  <div key={category} className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">
                      {getEntityIcon(category)} {category.replace(/_/g, ' ')}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item, i) => (
                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })}

            <div className="mt-4">
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                  View Extracted Text
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap">
                  {result.translated_text || result.standardized_text}
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2 border-b-4 border-blue-500 pb-4">
          🏛️ FRA Document OCR & AI Entity Recognition
        </h1>
        
      </div>

      <HealthIndicator />

      <div className="bg-white p-6 rounded-lg shadow mb-6 border-2 border-dashed border-blue-300">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaUpload className="w-5 h-5 text-blue-500" />
          Upload FRA Documents
        </h3>
        <input
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleFileChange}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={processDocuments}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? <FaSync className="w-4 h-4 animate-spin" /> : <FaBrain className="w-4 h-4" />}
          Full Analysis (OCR + AI NER)
        </button>

        <button
          onClick={extractTextOnly}
          disabled={loading}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? <FaSync className="w-4 h-4 animate-spin" /> : <FaFileAlt className="w-4 h-4" />}
          Extract Text Only
        </button>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? <FaSync className="w-4 h-4 animate-spin" /> : <FaHeart className="w-4 h-4" />}
          Check API Health
        </button>

        <button
          onClick={listAvailableResults}
          disabled={loading}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? <FaSync className="w-4 h-4 animate-spin" /> : <FaList className="w-4 h-4" />}
          View Available Downloads
        </button>

        <button
          onClick={getEligibleSchemes}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? <FaSync className="w-4 h-4 animate-spin" /> : <FaList className="w-4 h-4" />}
          Get Eligible Schemes
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <h3 className="font-semibold">❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 text-center">
          <FaSync className="w-5 h-5 animate-spin inline mr-2" />
          Processing...
        </div>
      )}

      {results && (
        <div className="bg-white p-6 rounded-lg shadow">
          {results.type === 'full' && <ProcessingResults results={results} />}
        </div>
      )}
    </div>
  );
};

export default OCR;
