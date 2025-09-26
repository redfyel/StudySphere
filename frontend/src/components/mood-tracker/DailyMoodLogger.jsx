import React, { useState } from 'react';
import './LoggingSection.css';

const DUMMY_OVERALL_MOODS = [
  { id: 1, emoji: '😞', label: 'Stressed' },
  { id: 2, emoji: '🙁', label: 'Down' },
  { id: 3, emoji: '😐', label: 'Neutral' },
  { id: 4, emoji: '😌', label: 'Balanced' },
  { id: 5, emoji: '😄', label: 'Happy' },
  { id: 6, emoji: '🤩', label: 'Awesome' },
];

const DailyMoodLogger = ({ onLog, isLoggedToday }) => {
  const [selectedOverallMood, setSelectedOverallMood] = useState(DUMMY_OVERALL_MOODS[3]); // Default to 'Balanced'
  const [overallMoodNotes, setOverallMoodNotes] = useState('');

  const handleLog = () => {
    if (!selectedOverallMood) return;
    onLog({ mood: selectedOverallMood, notes: overallMoodNotes });
    setOverallMoodNotes(''); // Clear notes after logging
  };

  const moodColorClass = `mood-${selectedOverallMood.label.toLowerCase()}`;

  return (
    // ✅ The main container now becomes disabled when a mood is logged
    <div className={`moocard ${isLoggedToday ? 'disabled' : ''}`}>
      <h2 className="moocard-title">Log Your <span>Overall</span> Vibe</h2>
      
      {/* ✅ INSTRUCTIONAL TEXT: Informs the user about the one-time nature */}
      <p className="mood-logger-instruction">
        Your overall mood can be logged once per day to track long-term trends.
      </p>
      
      {/* ✅ DISABLED OVERLAY: Visually blocks the component when logged */}
      {isLoggedToday && (
          <div className="logger-disabled-overlay">
              <span className="disabled-message">Logged for Today</span>
          </div>
      )}

      {/* --- The original logger UI is below --- */}
      <div className="overall-mood-slider-container">
        <div className={`overall-mood-display ${moodColorClass}`}>
          {selectedOverallMood.emoji}
        </div>
        
        <p className="overall-mood-label">{selectedOverallMood.label}</p>
        
        <input
          type="range"
          min="0"
          max={DUMMY_OVERALL_MOODS.length - 1}
          value={DUMMY_OVERALL_MOODS.indexOf(selectedOverallMood)}
          onChange={(e) => setSelectedOverallMood(DUMMY_OVERALL_MOODS[parseInt(e.target.value)])}
          className="mood-slider"
        />
      </div>
      <textarea
        placeholder="Why this mood? (Optional notes)"
        value={overallMoodNotes}
        onChange={(e) => setOverallMoodNotes(e.target.value)}
        className="text-area"
      />
      <button onClick={handleLog} className="log-button">
        Log Daily Mood
      </button>
    </div>
  );
};

export default DailyMoodLogger;