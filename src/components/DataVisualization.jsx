import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const DataVisualization = ({ data, containerClass = 'viz-container' }) => {
  const chartRef = useRef(null);
  const svgRef = useRef(null);

  // Color schemes for different visualizations
  const landCoverColors = {
    'Tree cover': '#2d5016',
    'Shrubland': '#5cb85c',
    'Grassland': '#90ee90',
    'Cropland': '#ffd700',
    'Built-up': '#ff6b6b',
    'Bare/sparse vegetation': '#deb887',
    'Permanent water bodies': '#4682b4',
    'Herbaceous wetland': '#20b2aa'
  };

  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return;

    // Clear previous visualizations
    d3.select(chartRef.current).selectAll('*').remove();

    createVisualization();
  }, [data]);

  const createVisualization = () => {
    if (!chartRef.current || !data) return;

    const container = d3.select(chartRef.current);
    const containerRect = chartRef.current.getBoundingClientRect();
    const width = Math.max(400, containerRect.width - 40);
    const height = 300;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };

    // Create main SVG
    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', 'rgba(0, 0, 0, 0.1)')
      .style('border-radius', '8px');

    // Analyze data to determine best visualization
    const numericColumns = [];
    const sampleRow = data[0];
    
    Object.keys(sampleRow).forEach(key => {
      const values = data.map(row => parseFloat(row[key])).filter(val => !isNaN(val));
      if (values.length > data.length * 0.5) { // At least 50% numeric values
        numericColumns.push({
          column: key,
          values: values,
          mean: d3.mean(values),
          max: d3.max(values),
          min: d3.min(values)
        });
      }
    });

    if (numericColumns.length >= 2) {
      // Create scatter plot for two numeric columns
      createScatterPlot(svg, numericColumns[0], numericColumns[1], width, height, margin);
    } else if (numericColumns.length === 1) {
      // Create histogram for single numeric column
      createHistogram(svg, numericColumns[0], width, height, margin);
    } else {
      // Create bar chart for categorical data
      createBarChart(svg, data, width, height, margin);
    }
  };

  const createScatterPlot = (svg, xCol, yCol, width, height, margin) => {
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([xCol.min, xCol.max])
      .range([0, width - margin.left - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([yCol.min, yCol.max])
      .range([height - margin.top - margin.bottom, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', width / 2 - margin.left)
      .attr('y', 40)
      .attr('fill', '#f5f5f5')
      .style('text-anchor', 'middle')
      .text(xCol.column);

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -(height - margin.top - margin.bottom) / 2)
      .attr('fill', '#f5f5f5')
      .style('text-anchor', 'middle')
      .text(yCol.column);

    // Add dots
    g.selectAll('.dot')
      .data(data.slice(0, 100)) // Limit to 100 points for performance
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(parseFloat(d[xCol.column]) || 0))
      .attr('cy', d => yScale(parseFloat(d[yCol.column]) || 0))
      .attr('r', 4)
      .style('fill', '#39ff88')
      .style('opacity', 0.7)
      .on('mouseover', function() {
        d3.select(this).attr('r', 6).style('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4).style('opacity', 0.7);
      });

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .style('fill', '#f5f5f5')
      .text(`${xCol.column} vs ${yCol.column}`);
  };

  const createHistogram = (svg, col, width, height, margin) => {
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const histogram = d3.histogram()
      .value(d => d)
      .domain([col.min, col.max])
      .thresholds(15);

    const bins = histogram(col.values);

    const xScale = d3.scaleLinear()
      .domain([col.min, col.max])
      .range([0, width - margin.left - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .range([height - margin.top - margin.bottom, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', width / 2 - margin.left)
      .attr('y', 40)
      .attr('fill', '#f5f5f5')
      .style('text-anchor', 'middle')
      .text(col.column);

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -(height - margin.top - margin.bottom) / 2)
      .attr('fill', '#f5f5f5')
      .style('text-anchor', 'middle')
      .text('Frequency');

    // Add bars
    g.selectAll('rect')
      .data(bins)
      .enter().append('rect')
      .attr('x', d => xScale(d.x0))
      .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
      .attr('y', d => yScale(d.length))
      .attr('height', d => height - margin.top - margin.bottom - yScale(d.length))
      .style('fill', '#39ff88')
      .style('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).style('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.8);
      });

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .style('fill', '#f5f5f5')
      .text(`Distribution of ${col.column}`);
  };

  const createBarChart = (svg, data, width, height, margin) => {
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Get first categorical column
    const firstCol = Object.keys(data[0])[0];
    const categoryCount = d3.rollup(
      data.slice(0, 20), // Limit for performance
      v => v.length,
      d => d[firstCol]
    );

    const categories = Array.from(categoryCount, ([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value);

    const xScale = d3.scaleBand()
      .domain(categories.map(d => d.key))
      .range([0, width - margin.left - margin.right])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(categories, d => d.value)])
      .range([height - margin.top - margin.bottom, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add bars
    g.selectAll('.bar')
      .data(categories)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.key))
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.value))
      .attr('height', d => height - margin.top - margin.bottom - yScale(d.value))
      .style('fill', '#39ff88')
      .style('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).style('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.8);
      });

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .style('fill', '#f5f5f5')
      .text(`${firstCol} Distribution`);
  };

  return (
    <div className={containerClass}>
      <div ref={chartRef} style={{ width: '100%', minHeight: '300px' }}></div>
    </div>
  );
};

export default DataVisualization;