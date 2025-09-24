


import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#228B22", "#CD853F", "#FFD700", "#1E90FF", "#A52A2A"];

const Charts = ({ data }) => {
  if (!data || data.length === 0) return <p style={{ color: "#fff" }}>No data available</p>;

  // Aggregate totals for Pie chart
  const totals = {
    forest: 0,
    shrubland: 0,
    grassland: 0,
    cropland: 0,
    water: 0,
  };

  data.forEach((row) => {
    totals.forest += row.forest_ha || 0;
    totals.shrubland += row.shrubland_ha || 0;
    totals.grassland += row.grassland_ha || 0;
    totals.cropland += row.cropland_ha || 0;
    totals.water += row.water_ha || 0;
  });

  const pieData = [
    { name: "Forest", value: totals.forest },
    { name: "Shrubland", value: totals.shrubland },
    { name: "Grassland", value: totals.grassland },
    { name: "Cropland", value: totals.cropland },
    { name: "Water", value: totals.water },
  ];

  const barData = [...data]
    .filter((d) => d.total_area_ha)
    .sort((a, b) => b.total_area_ha - a.total_area_ha)
    .slice(0, 10);

  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      {/* Pie Chart */}
      <PieChart width={400} height={300}>
        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
          {pieData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>

      {/* Bar Chart */}
      <BarChart width={500} height={300} data={barData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff44" /> {/* light grid */}
        <XAxis
          dataKey="village_name"
          angle={-45}
          textAnchor="end"
          height={70}
          tick={{ fill: "#fff" }} // white text
        />
        <YAxis tick={{ fill: "#fff" }} /> {/* white text */}
        <Tooltip
          contentStyle={{ backgroundColor: "#2a6b46", color: "#fff" }}
        />
        <Legend wrapperStyle={{ color: "#fff" }} /> {/* legend text white */}
        <Bar dataKey="total_area_ha" fill="#7FC97F" name="Total Area (ha)" /> {/* brighter green */}
      </BarChart>
    </div>
  );
};

export default Charts;
