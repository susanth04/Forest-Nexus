import React, { createContext, useContext, useState } from 'react';

// Create the OCR Context
const OcrContext = createContext();

// Custom hook to use the OCR context
export const useOcrContext = () => {
  const context = useContext(OcrContext);
  if (!context) {
    throw new Error('useOcrContext must be used within an OcrProvider');
  }
  return context;
};

// OCR Context Provider component
export const OcrProvider = ({ children }) => {
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  // Function to reset the context state
  const resetContext = () => {
    setExtractedText('');
    setIsLoading(false);
    setError(null);
    setUploadedFile(null);
    setProcessedData(null);
  };

  const value = {
    extractedText,
    setExtractedText,
    isLoading,
    setIsLoading,
    error,
    setError,
    uploadedFile,
    setUploadedFile,
    processedData,
    setProcessedData,
    resetContext,
  };

  return (
    <OcrContext.Provider value={value}>
      {children}
    </OcrContext.Provider>
  );
};

export default OcrContext;