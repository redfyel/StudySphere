import React, { useState, useRef, useEffect } from 'react';

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
    
    // Count words (split by whitespace, filter empty strings)
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
    // Ctrl/Cmd + S for save indication
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      setLastSaved(new Date().toLocaleTimeString());
    }
    
    // Tab key support (insert 2 spaces instead of focusing next element)
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Insert two spaces
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      
      // Create synthetic event for onChange
      const syntheticEvent = {
        target: { value: newValue }
      };
      onNotesChange(syntheticEvent);
      
      // Set cursor position after the inserted spaces
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
      // Brief visual feedback
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

      <style jsx>{`
        .notes {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          transition: all 0.3s ease;
        }
        
        .notes-expanded {
          max-width: 90vw;
          width: 90vw;
        }
        
        .notes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .notes h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
        }
        
        .notes-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
          min-width: 32px;
        }
        
        .action-btn:hover:not(:disabled) {
          background: #f9fafb;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .expand-btn {
          font-weight: bold;
          font-size: 16px;
        }
        
        .textarea-container {
          position: relative;
        }
        
        .notes-textarea {
          width: 100%;
          min-height: 120px;
          max-height: 400px;
          padding: 16px;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
          resize: vertical;
          background: white;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }
        
        .notes-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .notes-textarea::placeholder {
          color: #9ca3af;
          line-height: 1.4;
        }
        
        .notes-expanded .notes-textarea {
          min-height: 300px;
          max-height: 600px;
        }
        
        .notes-footer {
          margin-top: 8px;
        }
        
        .notes-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #6b7280;
        }
        
        .stat {
          margin-right: 16px;
        }
        
        .last-saved {
          font-style: italic;
          color: #059669;
        }
        
        /* Mobile responsive */
        @media (max-width: 640px) {
          .notes {
            max-width: 100%;
            padding: 0 8px;
          }
          
          .notes-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .notes-actions {
            align-self: flex-end;
          }
          
          .action-btn {
            padding: 8px 12px;
            min-width: 36px;
          }
          
          .notes-textarea {
            font-size: 16px; /* Prevent zoom on iOS */
          }
          
          .notes-stats {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
        
        /* Smooth animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .last-saved {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </div>
  );
}

export default Notes;