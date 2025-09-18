import React, { useState, useRef, useEffect } from 'react';
import './Notes.css'; // Assuming a separate CSS file for these styles

function Notes({ notes, onNotesChange }) {
  const [charCount, setCharCount] = useState(notes?.length || 0);
  const [wordCount, setWordCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const textareaRef = useRef(null);

  // Auto-save functionality
  useEffect(() => {
    if (notes && notes.length > 0) {
      const timer = setTimeout(() => {
        setLastSaved(new Date().toLocaleTimeString());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [notes]);

  // Update character and word count
  useEffect(() => {
    const text = notes || '';
    setCharCount(text.length);
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(text.trim().length === 0 ? 0 : words.length);
  }, [notes]);

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
    }
    onNotesChange(e);
  };

  // Keyboard shortcuts
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      setLastSaved(new Date().toLocaleTimeString());
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onNotesChange({ target: { value: newValue } });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Clear notes function
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
      onNotesChange({ target: { value: '' } });
    }
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notes || '');
      const button = document.querySelector('.copy-btn');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`notes ${isExpanded ? 'notes-expanded' : ''}`}>
      <div className="notes-header">
        <h3>Shared Notes</h3>
        <div className="notes-actions">
          <button 
            onClick={toggleExpanded} 
            className="action-btn expand-btn"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button 
            onClick={handleCopy} 
            className="action-btn copy-btn"
            title="Copy to clipboard"
            disabled={!notes || notes.length === 0}
          >
            📋
          </button>
          <button 
            onClick={handleClear} 
            className="action-btn clear-btn"
            title="Clear all notes"
            disabled={!notes || notes.length === 0}
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="textarea-container">
        <textarea
          ref={textareaRef}
          value={notes || ''}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your notes here... 
• Use Tab for indentation
• Ctrl+S to save
• Auto-saves as you type"
          className="notes-textarea"
          spellCheck="true"
        />
      </div>
      
      <div className="notes-footer">
        <div className="notes-stats">
          <span className="stat">
            <strong>{charCount}</strong> characters
          </span>
          <span className="stat">
            <strong>{wordCount}</strong> words
          </span>
          {lastSaved && (
            <span className="last-saved">
              Last saved: {lastSaved}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notes;