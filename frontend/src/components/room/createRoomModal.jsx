import React, { useState } from 'react';
import './CreateRoomModal.css';

function CreateRoomModal({ onClose, onCreateRoom, user }) {
  const [roomName, setRoomName] = useState('');
  const [roomTopic, setRoomTopic] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomType, setRoomType] = useState('private');
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    if (!roomName.trim()) {
      setError('Room name cannot be empty.');
      setIsCreating(false);
      return;
    }

    if (!user?.userId) {
      setError('User authentication required.');
      setIsCreating(false);
      return;
    }

    try {
      const newRoom = await onCreateRoom({
        name: roomName.trim(),
        topic: roomTopic.trim(),
        description: roomDescription.trim(),
        roomType,
        maxParticipants: parseInt(maxParticipants, 10),
      });

      alert(`Room "${newRoom.name}" created successfully!`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <h2>Create a New Study Room</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Form */}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="roomName">Room Name <span className="required">*</span></label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Daily Study Session"
              required
              disabled={isCreating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomTopic">Topic</label>
            <input
              type="text"
              id="roomTopic"
              value={roomTopic}
              onChange={(e) => setRoomTopic(e.target.value)}
              placeholder="e.g., Mathematics, Literature"
              disabled={isCreating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomDescription">Description</label>
            <textarea
              id="roomDescription"
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              placeholder="Briefly describe what this room is about..."
              rows="3"
              disabled={isCreating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomType">Room Type</label>
            <select
              id="roomType"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              disabled={isCreating}
            >
              <option value="private">🔒 Private (Approval Required)</option>
              <option value="public">🌐 Public (Open to All)</option>
            </select>
            <small>
              {roomType === 'private'
                ? 'Private rooms require approval before joining.'
                : 'Public rooms allow anyone to join instantly.'}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="maxParticipants">Maximum Participants</label>
            <input
              type="number"
              id="maxParticipants"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              min="2"
              max="100"
              disabled={isCreating}
            />
            <small>Limit between 2 - 100 participants</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn cancel-btn" onClick={onClose} disabled={isCreating}>
              Cancel
            </button>
            <button type="submit" className="btn create-btn" disabled={isCreating}>
              {isCreating ? 'Creating...' : `Create ${roomType === 'private' ? 'Private' : 'Public'} Room`}
            </button>
          </div>
        </form>

        {/* Info Cards */}
       
      </div>
    </div>
  );
}

export default CreateRoomModal;
