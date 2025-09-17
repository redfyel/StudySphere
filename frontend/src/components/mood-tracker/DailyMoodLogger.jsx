import React, { useState } from 'react';

const DUMMY_OVERALL_MOODS = [
  { id: 1, emoji: '😞', label: 'Stressed' },
  { id: 2, emoji: '🙁', label: 'Down' },
  { id: 3, emoji: '😐', label: 'Neutral' },
  { id: 4, emoji: '😌', label: 'Balanced' },
  { id: 5, emoji: '😄', label: 'Happy' },
  { id: 6, emoji: '🤩', label: 'Awesome' },
];

const DailyMoodLogger = ({ onLog, styles }) => {
  const [selectedOverallMood, setSelectedOverallMood] = useState(DUMMY_OVERALL_MOODS[3]); // Default to 'Balanced'
  const [overallMoodNotes, setOverallMoodNotes] = useState('');

  const handleLog = () => {
    if (!selectedOverallMood) {
      alert('Please select an overall mood!');
      return;
    }
    onLog({ mood: selectedOverallMood, notes: overallMoodNotes });
    setOverallMoodNotes('');
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Log Your *Daily Overall* Vibe</h2>
      <div style={styles.overallMoodSliderContainer}>
        <div style={styles.overallMoodDisplay}>
          {selectedOverallMood.emoji}
          <p style={styles.overallMoodLabel}>{selectedOverallMood.label}</p>
        </div>
        <input
          type="range"
          min="0"
          max={DUMMY_OVERALL_MOODS.length - 1}
          value={DUMMY_OVERALL_MOODS.indexOf(selectedOverallMood)}
          onChange={(e) => setSelectedOverallMood(DUMMY_OVERALL_MOODS[parseInt(e.target.value)])}
          className="mood-slider" // Use className instead of style
        />
      </div>
      <textarea
        placeholder="Why this mood? (Optional notes)"
        value={overallMoodNotes}
        onChange={(e) => setOverallMoodNotes(e.target.value)}
        style={styles.textArea}
      />
      <button onClick={handleLog} style={styles.logButton}>
        Log Daily Mood
      </button>
    </div>
  );
};

export default DailyMoodLogger;