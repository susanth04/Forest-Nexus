

import Papa from "papaparse";

export const loadCSV = (path) => {
  return new Promise((resolve, reject) => {
    Papa.parse(path, {
      header: true,
      download: true,
      dynamicTyping: true, // 👈 ensures numbers are parsed correctly
      skipEmptyLines: true,
      complete: (results) => {
        // filter out completely empty rows
        const cleaned = results.data.filter(
          (row) => row.village_name && row.total_area_ha
        );
        resolve(cleaned);
      },
      error: (err) => reject(err),
    });
  });
};
