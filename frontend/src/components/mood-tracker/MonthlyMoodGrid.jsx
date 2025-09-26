// MonthlyMoodGrid.js
import React from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';
import './MonthlyMoodGrid.css'; // We will create this CSS file next

const MonthlyMoodGrid = ({ startDate, endDate, moodData }) => {
  // Map mood labels to their corresponding emoji and CSS class
  const moodToVisuals = {
    Stressed: { emoji: '😞', className: 'mood-stressed' },
    Down: { emoji: '🙁', className: 'mood-down' },
    Neutral: { emoji: '😐', className: 'mood-neutral' },
    Balanced: { emoji: '😌', className: 'mood-balanced' },
    Happy: { emoji: '😄', className: 'mood-happy' },
    Awesome: { emoji: '🤩', className: 'mood-awesome' },
  };

  // Generate an array of all Date objects for the current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(startDate),
    end: endOfMonth(endDate),
  });

  // Create empty placeholder days to ensure the first day aligns with the correct weekday
  const firstDayOfMonthWeekday = getDay(daysInMonth[0]); // 0=Sun, 1=Mon...
  const paddingDays = Array.from({ length: firstDayOfMonthWeekday });

  // Helper to find the mood data for a specific day
  const getMoodEntryForDay = (day) => {
    return moodData.find(entry => format(new Date(entry.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="monthly-mood-grid-wrapper">
      <div className="monthly-mood-grid">
        {/* 1. Render Weekday Headers */}
        {weekdays.map(day => (
          <div key={day} className="weekday-header">{day}</div>
        ))}

        {/* 2. Render Padding Days */}
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="month-day-cell empty"></div>
        ))}

        {/* 3. Render Actual Days of the Month */}
        {daysInMonth.map((day, index) => {
          const moodEntry = getMoodEntryForDay(day);
          const visual = moodEntry ? moodToVisuals[moodEntry.mood] : null;

          return (
            <div
              key={index}
              className={`month-day-cell ${visual ? visual.className : 'unlogged'}`}
              data-tooltip-id="heatmap-tooltip" // Reuse the tooltip from the parent
              data-tooltip-content={moodEntry ? `${format(day, 'MMM d')}: ${moodEntry.mood}` : `${format(day, 'MMM d')}: No entry`}
            >
              <span className="month-date-number">{format(day, 'd')}</span>
              {visual && (
                <span className="month-day-emoji">{visual.emoji}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyMoodGrid;