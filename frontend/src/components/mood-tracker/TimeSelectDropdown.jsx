import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';
import './TimeSelectDropdown.css'; // We will create this new CSS file

// Inside TimeSelectDropdown.jsx
const TimeSelectDropdown = ({ options, selectedValue, onSelect }) => {
  return (
    <select 
      className="time-select-dropdown" // <--- ADD THIS CLASSNAME
      value={selectedValue} 
      onChange={(e) => onSelect(e.target.value)}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
};
export default TimeSelectDropdown;