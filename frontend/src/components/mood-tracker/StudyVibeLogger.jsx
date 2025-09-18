// StudyVibeLogger.js
import React, { useState } from 'react';
import './MoodTracker.css';

const DUMMY_STUDY_VIBES = [
  { id: 'energized', icon: '💪', label: 'ENERGIZED', desc: 'Ready to tackle tasks!' },
  { id: 'focused', icon: '💡', label: 'FOCUSED', desc: 'In the zone!' },
  { id: 'accomplished', icon: '⭐', label: 'ACCOMPLISHED', desc: 'Crushed my goals!' },
  { id: 'calm', icon: '☁️', label: 'CALM', desc: 'Feeling peaceful and clear-headed' },
  { id: 'overwhelmed', icon: '😵', label: 'OVERWHELMED', desc: 'Too much on your plate...' },
  { id: 'burntout', icon: '⏰', label: 'BURNT OUT', desc: 'Running on empty' },
];

const StudyVibeLogger = ({ onLog }) => {
  const [selectedStudyVibe, setSelectedStudyVibe] = useState(null);
  const [studySubject, setStudySubject] = useState('');

  const handleLog = () => {
    if (!selectedStudyVibe) {
      alert('Please select a study vibe!');
      return;
    }
    onLog({ vibe: selectedStudyVibe.id, subject: studySubject });
    setSelectedStudyVibe(null);
    setStudySubject('');
  };

  return (
    <div className="card">
      <h2 className="card-title">Log Your <span style={{ color: '#000' }}>Study</span> Vibe</h2>
      <div className="study-vibe-grid">
        {DUMMY_STUDY_VIBES.map((vibe) => (
          <div
            key={vibe.id}
            onClick={() => setSelectedStudyVibe(vibe)}
            className={`study-vibe-card ${selectedStudyVibe?.id === vibe.id ? 'selected' : ''} vibe-${vibe.id}`}
          >
            <span className="study-vibe-icon">{vibe.icon}</span>
            <span className="study-vibe-label">{vibe.label}</span>
            <span className="study-vibe-desc">{vibe.desc}</span>
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="E.g., Which subject was this for?"
        value={studySubject}
        onChange={(e) => setStudySubject(e.target.value)}
        className="input-field"
      />
      <button onClick={handleLog} className="log-button">
        Log Study Vibe
      </button>
    </div>
  );
};

export default StudyVibeLogger;