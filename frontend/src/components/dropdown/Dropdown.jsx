import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';
import './Dropdown.css';

const Dropdown = ({ options, onSelect, placeholder = 'Select an option' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);

  // Effect to handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    onSelect(option); // Pass the selected option to the parent component
    setIsOpen(false);
  };

  const selectedLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <button className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedLabel}</span>
        <motion.div
          className="dropdown-chevron"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FaChevronDown />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className="dropdown-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {options.map((option) => (
              <li
                key={option.value}
                className="dropdown-item"
                onClick={() => handleOptionClick(option)}
              >
                {option.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;