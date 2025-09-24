import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './CustomToolbar.css';

const CustomToolbar = ({ label, onNavigate }) => (
  <div className="custom-toolbar-container">
    <div className="toolbar-left">
      <h1 className="calendar-title">Calendar</h1>
      <div className="view-switcher">
        <button type="button">Day</button>
        <button type="button">Week</button>
        <button type="button" className="active">Month</button>
      </div>
    </div>
    <div className="toolbar-right">
      <span className="toolbar-label">{label}</span>
      <div className="toolbar-nav">
        <button type="button" onClick={() => onNavigate('PREV')}><FiChevronLeft size={20} /></button>
        <button type="button" onClick={() => onNavigate('NEXT')}><FiChevronRight size={20} /></button>
      </div>
      <button className="add-event-btn">+ Add Event</button>
    </div>
  </div>
);

export default CustomToolbar;