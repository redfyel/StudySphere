// CreateRoomModal.jsx

import React, { useState } from 'react';
import './CreateRoomModal.css'; // Create this CSS file

function CreateRoomModal({ isOpen, onClose, onCreateRoom }) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const ownerId = localStorage.getItem('studyRoomUserId') || Date.now().toString();
    localStorage.setItem('studyRoomUserId', ownerId);
    onCreateRoom({ name, topic, ownerId });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Create a New Room</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Room Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit">Create</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRoomModal;