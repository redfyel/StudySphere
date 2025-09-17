import React, { useState } from 'react';

const DUMMY_STUDY_VIBES = [
  { id: 'energized', icon: '💪', label: 'ENERGIZED', desc: 'Ready to tackle tasks!' },
  { id: 'focused', icon: '💡', label: 'FOCUSED', desc: 'In the zone!' },
  { id: 'accomplished', icon: '⭐', label: 'ACCOMPLISHED', desc: 'Crushed my goals!' },
  { id: 'calm', icon: '☁️', label: 'CALM', desc: 'Feeling peaceful and clear-headed' },
  { id: 'overwhelmed', icon: '😵', label: 'OVERWHELMED', desc: 'Too much on your plate...' },
  { id: 'burntout', icon: '⏰', label: 'BURNT OUT', desc: 'Running on empty' },
];

const StudyVibeLogger = ({ onLog, styles }) => {
  const [selectedStudyVibe, setSelectedStudyVibe] = useState(null);
  const [studySubject, setStudySubject] = useState('');

  const handleLog = () => {
    if (!selectedStudyVibe) {
      alert('Please select a study vibe!');
      return;
    }
    onLog({ vibe: selectedStudyVibe, subject: studySubject });
    setSelectedStudyVibe(null);
    setStudySubject('');
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Log Your *Study* Vibe</h2>
      <div style={styles.studyVibeGrid}>
        {DUMMY_STUDY_VIBES.map((vibe) => (
          <div
            key={vibe.id}
            onClick={() => setSelectedStudyVibe(vibe)}
            style={{
              ...styles.studyVibeCard,
              ...(selectedStudyVibe?.id === vibe.id ? styles.studyVibeCardSelected : {}),
              background: vibe.id === 'energized' ? '#ffedd5' :
                          vibe.id === 'focused' ? '#dcfce7' :
                          vibe.id === 'accomplished' ? '#e0f2fe' :
                          vibe.id === 'calm' ? '#e0f2fe' :
                          vibe.id === 'overwhelmed' ? '#fee2e2' :
                          vibe.id === 'burntout' ? '#ffe4e6' : '#f0f4f8'
            }}
          >
            <span style={styles.studyVibeIcon}>{vibe.icon}</span>
            <span style={styles.studyVibeLabel}>{vibe.label}</span>
            <span style={styles.studyVibeDesc}>{vibe.desc}</span>
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="E.g., Which subject was this for?"
        value={studySubject}
        onChange={(e) => setStudySubject(e.target.value)}
        style={styles.inputField}
      />
      <button onClick={handleLog} style={styles.logButton}>
        Log Study Vibe
      </button>
    </div>
  );
};

export default StudyVibeLogger;