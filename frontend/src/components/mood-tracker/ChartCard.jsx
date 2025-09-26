import React from 'react';
import './ChartCard.css';

// Add 'subtitle' to the component's props
const ChartCard = ({ title, subtitle, children, className }) => {
  return (
    <div className={`analy-chart-card ${className || ''}`}>
      
      <div className="analy-chart-card-header">
        <h2 className="analy-chart-card-title">{title}</h2>
        {subtitle && <h3 className="analy-chart-card-subtitle">{subtitle}</h3>}
      </div>
      
      <div className="analy-chart-content-area">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;