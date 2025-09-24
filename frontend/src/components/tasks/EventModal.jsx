// src/components/tasks/EventModal.js

import React, { useState, useEffect } from "react";
import "./EventModal.css";

const colorOptions = ["#D9A4DE", "#AEC6CF", "#F4989C", "#97C1A9", "#F7D89C"];

const EventModal = ({ isOpen, onClose, onSave, event }) => {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(colorOptions[0]);

  useEffect(() => {
    // If an existing event is passed, populate the form
    if (event) {
      setTitle(event.title || "");
      setColor(event.color || colorOptions[0]);
    } else {
      // Reset for a new event
      setTitle("");
      setColor(colorOptions[0]);
    }
  }, [event, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave({ title, color });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{event?.id ? "Edit Event" : "Add Event"}</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event Title"
          className="modal-input"
        />
        <div className="color-picker">
          {colorOptions.map((c) => (
            <div
              key={c}
              className={`color-dot ${color === c ? "selected" : ""}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;