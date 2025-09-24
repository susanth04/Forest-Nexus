

import React from "react";

const DataTable = ({ data }) => {
  if (!data || data.length === 0) return <p>No data available</p>;

  return (
    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
      <table
        border="0"
        cellPadding="6"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          color: "#f0f9f0", // brighter text
          fontWeight: "500",
        }}
      >
        <thead style={{ backgroundColor: "#3a7750", color: "#d8f3dc" }}>
          <tr>
            <th>Village</th>
            <th>Total Area (ha)</th>
            <th>Forest (ha)</th>
            <th>Shrubland (ha)</th>
            <th>Grassland (ha)</th>
            <th>Cropland (ha)</th>
            <th>Water (ha)</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((row, i) => (
            <tr
              key={i}
              style={{
                backgroundColor: i % 2 === 0 ? "#4e9667" : "#3a7750", // lighter alternating rows
                transition: "background 0.2s",
              }}
            >
              <td>{row.village_name}</td>
              <td>{row.total_area_ha}</td>
              <td>{row.forest_ha}</td>
              <td>{row.shrubland_ha}</td>
              <td>{row.grassland_ha}</td>
              <td>{row.cropland_ha}</td>
              <td>{row.water_ha}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
