import React, { createContext, useContext, useState } from 'react';

const OcrContext = createContext({
  ocrResults: null,
  setOcrResults: () => {},
});

export function useOcr() {
  const context = useContext(OcrContext);
  if (!context) {
    throw new Error('useOcr must be used within an OcrProvider');
  }
  return context;
}

export function OcrProvider({ children }) {
  const [ocrResults, setOcrResults] = useState(null);

  const value = {
    ocrResults,
    setOcrResults
  };

  return (
    <OcrContext.Provider value={value}>
      {children}
    </OcrContext.Provider>
  );
}
