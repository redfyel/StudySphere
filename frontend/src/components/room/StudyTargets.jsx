import React, { useState } from 'react';

function StudyTargets({ targets, onTargetsChange }) {
  const [newTarget, setNewTarget] = useState('');

  const addTarget = () => {
    if (newTarget.trim()) {
      onTargetsChange([...targets, newTarget.trim()]);
      setNewTarget('');
    }
  };

  const removeTarget = (index) => {
    const updatedTargets = [...targets];
    updatedTargets.splice(index, 1);
    onTargetsChange(updatedTargets);
  };

  return (
    <div className="study-targets">
      <h3>Study Targets</h3>
      <div className="target-input">
        <input
          type="text"
          value={newTarget}
          onChange={(e) => setNewTarget(e.target.value)}
          placeholder="Add a new study target"
        />
        <button onClick={addTarget}>Add</button>
      </div>
      <ul className="target-list">
        {targets.map((target, index) => (
          <li key={index}>
            {target}
            <button onClick={() => removeTarget(index)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudyTargets;