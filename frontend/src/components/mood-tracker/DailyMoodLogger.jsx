import React, { useState } from 'react';

const DUMMY_OVERALL_MOODS = [
  { id: 1, emoji: '😞', label: 'Stressed' },
  { id: 2, emoji: '🙁', label: 'Down' },
  { id: 3, emoji: '😐', label: 'Neutral' },
  { id: 4, emoji: '😌', label: 'Balanced' },
  { id: 5, emoji: '😄', label: 'Happy' },
  { id: 6, emoji: '🤩', label: 'Awesome' },
];

const DailyMoodLogger = ({ onLog }) => { // Removed 'styles' prop
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
    <div className="card"> {/* Use className="card" */}
      <h2 className="card-title">Log Your <span style={{ color: '#000' }}>Daily Overall </span>Vibe</h2> {/* Use className="card-title" */}
      <div className="overall-mood-slider-container"> {/* Assuming you'll add this class if needed, or remove this div */}
        <div className="overall-mood-display"> {/* Use className="overall-mood-display" */}
          {selectedOverallMood.emoji}
          <p className="overall-mood-label">{selectedOverallMood.label}</p> {/* Use className="overall-mood-label" */}
        </div>
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
        className="text-area" // Use className="text-area"
      />
      <button onClick={handleLog} className="log-button"> {/* Use className="log-button" */}
        Log Daily Mood
      </button>
    </div>
  );
};

export default DailyMoodLogger;