
import React, { useState, useRef, useEffect } from 'react';
import ViewSwitcher from './ViewSwitcher';
// Import new icons
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaRegCalendarAlt, FaRegCalendar, FaCalendarWeek } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import { startOfWeek, endOfWeek } from 'date-fns'; 
import 'react-day-picker/dist/style.css';
import './CommandBar.css'; // Points to the new CSS

// Custom hook (no changes needed)
const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

// --- Unified Date Picker Component ---
const UnifiedDatePicker = ({ selectedView, currentDate, onDateSelect, closePicker }) => {
 const [viewDate, setViewDate] = useState(currentDate);
    const [hoveredDate, setHoveredDate] = useState(null); 
       const handleDayClick = (day) => {
        onDateSelect(day);
        closePicker();
    };

    const handleMonthSelect = (monthIndex) => {
        const newDate = new Date(viewDate.getFullYear(), monthIndex, 1);
        onDateSelect(newDate);
        closePicker();
    };

    const handleYearSelect = (year) => {
        onDateSelect(new Date(year, 0, 1));
        closePicker();
    }

    if (selectedView === 'week') {
        const weekModifier = {
            from: startOfWeek(currentDate),
            to: endOfWeek(currentDate)
        };

        const hoveredWeekModifier = hoveredDate ? {
            from: startOfWeek(hoveredDate),
            to: endOfWeek(hoveredDate)
        } : undefined;

        return (
            <DayPicker
                mode="single"
                required
                showOutsideDays
                selected={currentDate}
                onSelect={handleDayClick}
                // Modifiers for styling the selected and hovered week ranges
                modifiers={{
                    selected_week: weekModifier,
                    hovered_week: hoveredWeekModifier,
                }}
                modifiersClassNames={{
                    selected_week: 'rdp-day_selected_week',
                    hovered_week: 'rdp-day_hovered_week',
                }}
                // Handlers to track the user's mouse for the hover effect
                onDayMouseEnter={(day) => setHoveredDate(day)}
                onDayMouseLeave={() => setHoveredDate(null)}
                className="week-picker"
            />
        );
    }

    // Year Picker
    if (selectedView === 'year') {
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 12 }, (_, i) => currentYear - 6 + i);
        return (
            <div className="year-picker-grid">
                {years.map(year => (
                    <button
                        key={year}
                        className={`year-pill ${year === currentDate.getFullYear() ? 'active' : ''}`}
                        onClick={() => handleYearSelect(year)}
                    >
                        {year}
                    </button>
                ))}
            </div>
        );
    }

    // Month Picker
    if (selectedView === 'month') {
        const monthOptions = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return (
            <div className="month-picker">
                <div className="month-picker-header">
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear() - 1, 1, 1))} className="year-arrow"><FaChevronLeft /></button>
                    <span className="year-display">{viewDate.getFullYear()}</span>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear() + 1, 1, 1))} className="year-arrow"><FaChevronRight /></button>
                </div>
                <div className="month-grid">
                    {monthOptions.map((month, index) => (
                        <button
                            key={month}
                            className={`month-pill ${currentDate.getFullYear() === viewDate.getFullYear() && currentDate.getMonth() === index ? 'active' : ''}`}
                            onClick={() => handleMonthSelect(index)}
                        >
                            {month}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Week Picker (Default)
    return (
        <DayPicker
            mode="single"
            required
            showOutsideDays
            selected={currentDate}
            onSelect={handleDayClick}
            modifiersClassNames={{
                selected: 'rdp-day_selected_custom',
                today: 'rdp-day_today_custom',
            }}
            className="week-picker"
        />
    );
};

const CommandBar = ({ selectedView, setSelectedView, anchorDate, setAnchorDate, title }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  useOnClickOutside(pickerRef, () => setIsPickerOpen(false));

  // --- NEW: Define views with icons ---
  const views = [
    { id: 'week', label: 'Week', icon: <FaCalendarWeek /> },
    { id: 'month', label: 'Month', icon: <FaRegCalendar /> },
    { id: 'year', label: 'Year', icon: <FaRegCalendarAlt /> },
  ];

  return (
    <div className="command-bar-container" ref={pickerRef}>
      <ViewSwitcher
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        views={views}
      />
 <div className="selection-bar">
        {/* This new label adds context for the user */}
        <p className="selection-bar-label">Select Time Period</p>
        
        <button className="selection-bar-button" onClick={() => setIsPickerOpen(!isPickerOpen)}>
          <span>{title}</span>
          <FaCalendarAlt />
        </button>
      </div>

      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            className="picker-popup"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <UnifiedDatePicker
                selectedView={selectedView}
                currentDate={anchorDate}
                onDateSelect={setAnchorDate}
                closePicker={() => setIsPickerOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommandBar;