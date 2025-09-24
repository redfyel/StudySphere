import React from 'react';
import './CalendarFilters.css';

const CalendarFilters = ({ eventTypes, filters, setFilters }) => {
  const handleFilterChange = (type) => {
    setFilters(prevFilters => ({ ...prevFilters, [type]: !prevFilters[type] }));
  };

  return (
    <div className="calendar-filters-container">
      <h3 className="filters-title">Calendars</h3>
      {Object.entries(eventTypes).map(([type, { color }]) => (
        <label key={type} className="filter-item">
          <input
            type="checkbox"
            checked={filters[type]}
            onChange={() => handleFilterChange(type)}
          />
          <span
            className="custom-checkbox"
            style={{ '--checkbox-color': color, border: `2px solid ${color}` }}
          ></span>
          {type}
        </label>
      ))}
    </div>
  );
};

export default CalendarFilters;