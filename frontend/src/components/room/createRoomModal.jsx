import React, { useState } from 'react';
import './CreateRoomModal.css';

function CreateRoomModal({ isOpen, onClose, onCreateRoom }) {
  const [roomName, setRoomName] = useState('');
  const [roomTopic, setRoomTopic] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomName.trim() && roomTopic.trim()) {
      onCreateRoom({ name: roomName.trim(), topic: roomTopic.trim() });
      setRoomName('');
      setRoomTopic('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Study Room</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="roomName">Room Name:</label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Advanced Calculus Session"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="roomTopic">Topic:</label>
            <input
              type="text"
              id="roomTopic"
              value={roomTopic}
              onChange={(e) => setRoomTopic(e.target.value)}
              placeholder="e.g., Derivatives and Integrals"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Create Room</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRoomModal;