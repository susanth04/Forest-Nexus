

import React, { useEffect, useState } from "react";
import { loadCSV } from "../services/loadCSV";
import MapView from "../components/MapView";
import DataTable from "../components/DataTable";
import Charts from "../components/Charts";
import "./Dashboard.css";

import csvFile from "../assets/Warangal_Village_Assets_Cleaned.csv";

const Dashboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadCSV(csvFile)
      .then((d) => {
        console.log("✅ CSV Loaded:", d.slice(0, 5));
        setData(d);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="dashboard">
      <h1 className="title">🌳 Warangal Village Assets Dashboard</h1>

      <div className="grid">
        <div className="card">
          <h2>Interactive Map</h2>
          <MapView data={data} />
        </div>

        <div className="card">
          <h2>Land Use Overview</h2>
          <Charts data={data} />
        </div>

        <div className="card full-width">
          <h2>Village Data Table</h2>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
