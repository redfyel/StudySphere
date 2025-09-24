import React, { useState } from 'react';
import './AddEventModal.css';

const AddEventModal = ({ onClose, onAddEvent }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Task');
  const [startDate, setStartDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title && startDate) {
      onAddEvent({
        title,
        type,
        start: new Date(startDate),
        end: new Date(startDate),
      });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              placeholder="e.g., Study for finals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Date & Time</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Task">Task</option>
              <option value="Assignment Deadline">Assignment Deadline</option>
              <option value="Exam">Exam</option>
              <option value="Spaced Repetition">Spaced Repetition</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;