import React, { useState } from 'react';
import './CreateRoomModal.css';

function CreateRoomModal({ onClose, onCreateRoom, userId }) {
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    description: '',
    roomType: 'private', // Default to private
    maxParticipants: 10
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Room name is required');
      return;
    }

    if (formData.maxParticipants < 2 || formData.maxParticipants > 100) {
      setError('Max participants must be between 2 and 100');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const roomData = {
        ...formData,
        name: formData.name.trim(),
        topic: formData.topic.trim(),
        description: formData.description.trim(),
        createdBy: userId,
        maxParticipants: parseInt(formData.maxParticipants)
      };

      await onCreateRoom(roomData);
      onClose();
    } catch (error) {
      console.error('Error creating room:', error);
      setError(error.message || 'Failed to create room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="create-room-modal-overlay" onClick={handleOverlayClick}>
      <div className="create-room-modal">
        <div className="modal-header">
          <h2>Create New Study Room</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="room-form">
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Room Name */}
          <div className="form-group">
            <label htmlFor="name">Room Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Math Study Group"
              maxLength="50"
              required
              disabled={isSubmitting}
            />
            <small>{formData.name.length}/50 characters</small>
          </div>

          {/* Room Type Selection */}
          <div className="form-group room-type-selection">
            <label>Room Type *</label>
            <div className="room-type-options">
              <div 
                className={`room-type-option ${formData.roomType === 'public' ? 'selected' : ''}`}
                onClick={() => !isSubmitting && setFormData(prev => ({ ...prev, roomType: 'public' }))}
              >
                <div className="room-type-radio">
                  <input
                    type="radio"
                    name="roomType"
                    value="public"
                    checked={formData.roomType === 'public'}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  <span className="radio-custom"></span>
                </div>
                <div className="room-type-info">
                  <h4>🌐 Public Room</h4>
                  <p>Anyone can join immediately without approval</p>
                  <ul>
                    <li>Open to all users</li>
                    <li>No join approval required</li>
                    <li>Great for open study sessions</li>
                  </ul>
                </div>
              </div>

              <div 
                className={`room-type-option ${formData.roomType === 'private' ? 'selected' : ''}`}
                onClick={() => !isSubmitting && setFormData(prev => ({ ...prev, roomType: 'private' }))}
              >
                <div className="room-type-radio">
                  <input
                    type="radio"
                    name="roomType"
                    value="private"
                    checked={formData.roomType === 'private'}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  <span className="radio-custom"></span>
                </div>
                <div className="room-type-info">
                  <h4>🔒 Private Room</h4>
                  <p>Admin approval required for new participants</p>
                  <ul>
                    <li>Admin controls who joins</li>
                    <li>Join requests need approval</li>
                    <li>Perfect for focused study groups</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Topic */}
          <div className="form-group">
            <label htmlFor="topic">Study Topic</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., Calculus, History, Programming"
              maxLength="30"
              disabled={isSubmitting}
            />
            <small>Optional - Help others find your room</small>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what you'll be studying or any specific requirements..."
              rows="3"
              maxLength="200"
              disabled={isSubmitting}
            />
            <small>{formData.description.length}/200 characters</small>
          </div>

          {/* Max Participants */}
          <div className="form-group">
            <label htmlFor="maxParticipants">Max Participants</label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleInputChange}
              min="2"
              max="100"
              disabled={isSubmitting}
            />
            <small>Between 2 and 100 participants</small>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`create-button ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  Create {formData.roomType === 'public' ? '🌐 Public' : '🔒 Private'} Room
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRoomModal;