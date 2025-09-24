import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import './Sidebar.css';

const localizer = momentLocalizer(moment);

const Sidebar = ({ eventTypes, activeDate }) => {
  return (
    <aside className="calendar-sidebar">
      <div className="sidebar-section">
        <h2 className="sidebar-title">Filters</h2>
        <div className="filters-list">
          {Object.entries(eventTypes).map(([type, { color }]) => (
            <label key={type} className="filter-item">
              <input type="checkbox" defaultChecked />
              <span className="custom-checkbox" style={{ backgroundColor: color, borderColor: color }}></span>
              {type}
            </label>
          ))}
        </div>
      </div>
      <div className="sidebar-section">
        <Calendar
          localizer={localizer}
          events={[]}
          views={['month']}
          toolbar={false}
          date={activeDate}
        />
      </div>
    </aside>
  );
};

export default Sidebar;