import React from 'react';
import moment from 'moment';

const DateCellWrapper = ({ children, value: date, events, onDateSelect, activeDate }) => {
  const dayEvents = events.filter(e => moment(e.start).isSame(date, 'day'));
  const isSelected = moment(date).isSame(activeDate, 'day');
  const isToday = moment(date).isSame(new Date(), 'day');

  let wrapperClass = "rbc-day-bg";
  if (isSelected) {
    wrapperClass += " rbc-active";
  }
  if (isToday) {
    wrapperClass += " rbc-today";
  }

  return (
    <div className={wrapperClass} onClick={() => onDateSelect(date)}>
      {/* This renders the date number from the library */}
      {children}
      <div className="event-bars-wrapper">
        {dayEvents.slice(0, 4).map((event, index) => ( // Show max 4 bars to avoid overflow
          <div
            key={index}
            className="event-bar"
            style={{ backgroundColor: `var(--color-${event.type.toLowerCase().replace(/ /g, '-')})` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default DateCellWrapper;