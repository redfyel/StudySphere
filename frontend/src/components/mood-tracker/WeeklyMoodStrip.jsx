// WeeklyMoodStrip.js
import React from 'react';
import { format, addDays, isSameDay, isSameMonth } from 'date-fns';
import './WeeklyMoodStrip.css';

// --- Insight Generation Logic (no changes needed here) ---
const generateWeeklyInsight = (moodData) => {
  if (!moodData || moodData.length === 0) {
    return null;
  }
  const moodCounts = moodData.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});
  const dominantMood = Object.keys(moodCounts).reduce((a, b) =>
    moodCounts[a] > moodCounts[b] ? a : b
  );
  return (
    <div className="mood-insight-box">
      <p>
        Your dominant mood this week was{' '}
        <strong>{dominantMood}</strong>, logged on {moodCounts[dominantMood]} day(s).
      </p>
    </div>
  );
};

const WeeklyMoodStrip = ({ startDate, moodData }) => {
  // ✅ NEW: Map moods to their emoji and CSS class for consistency
  const moodToVisuals = {
    Stressed: { emoji: '😞', className: 'mood-stressed' },
    Down: { emoji: '🙁', className: 'mood-down' },
    Neutral: { emoji: '😐', className: 'mood-neutral' },
    Balanced: { emoji: '😌', className: 'mood-balanced' },
    Happy: { emoji: '😄', className: 'mood-happy' },
    Awesome: { emoji: '🤩', className: 'mood-awesome' },
  };

  const days = Array.from({ length: 7 }).map((_, i) => addDays(new Date(startDate), i));

  const getMoodEntryForDay = (day) => {
    return moodData.find(entry => isSameDay(new Date(entry.date), day));
  };

  const insight = generateWeeklyInsight(moodData);

  const firstDay = days[0];
  const lastDay = days[6];
  let weekRangeTitle = '';

  if (isSameMonth(firstDay, lastDay)) {
    weekRangeTitle = `${format(firstDay, 'MMM d')} - ${format(lastDay, 'd')}`;
  } else {
    weekRangeTitle = `${format(firstDay, 'MMM d')} - ${format(lastDay, 'MMM d')}`;
  }

  return (
    <div className="mood-strip-wrapper">
      <h2 className="week-range-title">{weekRangeTitle}</h2>
      <div className="mood-strip-container">
        {days.map(day => {
          const moodEntry = getMoodEntryForDay(day);
          // ✅ CHANGED: Look up the visual info (emoji, class) from our map
          const visual = moodEntry ? moodToVisuals[moodEntry.mood] : null;
          const tooltipContent = moodEntry ? moodEntry.mood : `No entry`;
          
          return (
            <div key={day.toString()} className="mood-day-item">
              <span className="mood-date-number">{format(day, 'd')}</span>
              <span className="mood-day-label">{format(day, 'E')}</span>
              <div
                className={`mood-square ${visual ? visual.className : 'empty'}`}
                data-tooltip-id="mood-strip-tooltip"
                data-tooltip-content={tooltipContent}
              >
                {/* ✅ FIXED: Render the emoji inside the square */}
                {visual && visual.emoji}
              </div>
            </div>
          );
        })}
      </div>
      {insight}
    </div>
  );
};

export default WeeklyMoodStrip;