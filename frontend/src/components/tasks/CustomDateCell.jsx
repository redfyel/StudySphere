import React from 'react';
import moment from 'moment';

const CustomDateCell = ({ children, value, events, onDateSelect, activeDate }) => {
  const dayEvents = events.filter(e => moment(e.start).isSame(value, 'day'));
  const isSelected = moment(value).isSame(activeDate, 'day');
  
  // Get unique event types for the day to avoid duplicate bar colors if you have multiple tasks of the same type
  const uniqueEventTypes = [...new Set(dayEvents.map(e => e.type))];

  return (
    <div className={`custom-date-cell ${isSelected ? 'active' : ''}`} onClick={() => onDateSelect(value)}>
      {children} {/* This renders the original number */}
      <div className="event-bars-container">
        {uniqueEventTypes.slice(0, 4).map(type => ( // Show max 4 bars to keep it clean
          <div key={type} className={`event-bar ${type.toLowerCase().replace(/ /g, '-')}`}></div>
        ))}
      </div>
    </div>
  );
};

export default CustomDateCell;