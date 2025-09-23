import React from 'react';

const ChartCard = ({ title, chartComponent, insight, children, className }) => { // Removed 'styles', 'gridColumn'
  return (
    <div className={`card ${className || ''}`}> 
      <h2 className="card-title">{title}</h2> {/* Use className="card-title" */}
      <div className="chart-content-area"> {/* A new class for the chart wrapper, can be 'chart-placeholder' if you prefer */}
        {chartComponent}
      </div>
      {insight && (
        <div className="insight-box"> {/* Use className="insight-box" */}
          {insight}
        </div>
      )}
      {children}
    </div>
  );
};

export default ChartCard;