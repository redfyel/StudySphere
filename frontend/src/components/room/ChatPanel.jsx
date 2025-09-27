import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Smile, MoreVertical, Trash2 } from 'lucide-react';

const ChatPanel = ({ 
  messages = [], 
  onSendMessage, 
  onDeleteMessage, // NEW prop
  currentUserId, 
  creatorId, // NEW prop
  onClose,
  typingUsers = [],
  embedded = true,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [menuMessageId, setMenuMessageId] = useState(null); // State for context menu
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const commonEmojis = ['😊', '😂', '👍', '❤️', '😢', '😮', '😡', '🎉', '👏', '🔥', '💯', '🤔', '😴', '🙄', '💪', '🎯', '✨', '👀', '🥳', '😎', '🤩', '👋', '✌️', '🙌', '🙏', '🤯', '😬', '🫠', '🤖', '👾', '🚀', '⭐'];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuMessageId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emoji) => {
    setInputMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const isOwnMessage = (message) => {
    return message.userId === currentUserId;
  };

  const canDelete = (message) => {
    return !!message.id && (message.userId === currentUserId || currentUserId === creatorId);
  };

  const handleDeleteClick = (messageId) => {
    onDeleteMessage(messageId);
    setMenuMessageId(null);
  };

  return (
    <div className={`chat-panel-container ${embedded ? 'embedded' : ''}`}>
      <style>
        {`
        /* --- Color Palette --- */
        :root {
            --primary-dark: #89a8b2; /* Header/Accent */
            --primary-medium: #b3c8cf; /* Own Message/Hover */
            --primary-light: #e5e1da; /* Panel Background */
            --primary-lightest: #f1f0e8; /* Other Message/Input BG */
            --text-dark: #1a1a1a;
            --danger: #EF4444;
            --mobile-breakpoint: 768px;
        }

        /* DEFAULT (Desktop Sidebar) STYLES */
        .chat-panel-container {
          position: fixed;
          right: 0;
          top: 0; 
          bottom: 0;
          width: 350px;
          display: flex;
          flex-direction: column;
          background-color: var(--primary-light);
          color: var(--text-dark);
          border-left: 1px solid #dcdcdc;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease-in-out;
          z-index: 1000;
          box-shadow: -4px 0 12px rgba(0,0,0,0.1);
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
        }

        /* --------------------------------------
        // MOBILE RESPONSIVENESS (Full Screen)
        // -------------------------------------- */
        @media (max-width: var(--mobile-breakpoint)) {
            .chat-panel-container {
                /* Full Screen Coverage */
                top: 0;
                right: 0; 
                bottom: 0;
                left: 0; /* Extends to the full left edge */
                transform: none; /* Remove vertical centering transform */
                
                /* Full Dimensions */
                width: 100%; 
                max-width: 100vw;
                height: 100%;
                max-height: 100vh;
                
                /* Appearance */
                border-radius: 0; /* Seamless transition */
                border: none;
                box-shadow: none;
            }
            
            .chat-header {
                border-radius: 0;
            }
        }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: var(--primary-dark);
          color: var(--primary-lightest);
          border-bottom: 1px solid #7a94a2;
          border-top-left-radius: 12px;
        }

        .chat-header h3 {
          margin: 0;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          color: var(--primary-lightest);
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .chat-messages {
          flex-grow: 1;
          padding: 1rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .message-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .message-wrapper.own-message {
            flex-direction: row-reverse;
            /* Added to make the whole wrapper align to the right */
            align-self: flex-end; 
            max-width: 100%;
        }

        .message {
          max-width: 85%;
          padding: 0.75rem 1rem;
          border-radius: 18px;
          line-height: 1.4;
          word-wrap: break-word;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          position: relative;
          color: var(--text-dark);
        }
        
        /* New: Pending message style */
        .message.is-pending {
            opacity: 0.7;
            font-style: italic;
        }

        .message.own-message {
          align-self: flex-end;
          background-color: var(--primary-medium);
          color: var(--text-dark);
          border-bottom-right-radius: 4px;
        }

        .message.other-message {
          align-self: flex-start;
          background-color: var(--primary-lightest);
          color: var(--text-dark);
          border-bottom-left-radius: 4px;
        }

        .message-header {
          font-size: 0.7rem;
          opacity: 0.7;
          margin-bottom: 0.25rem;
        }

        .message-header .username {
          font-weight: 600;
        }

        .message-header .timestamp {
          float: right;
        }
        
        /* Message Options Button */
        .message-options-btn {
            background: none;
            border: none;
            color: #5a5a5a;
            cursor: pointer;
            padding: 4px;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .message-wrapper:hover .message-options-btn, .message-options-btn.active {
            opacity: 1;
        }

        /* Message Context Menu */
        .message-context-menu {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1010;
            background: var(--primary-lightest);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 150px;
            white-space: nowrap;
        }
        
        .message-wrapper.other-message .message-context-menu {
            left: calc(100% + 5px);
        }

        .message-wrapper.own-message .message-context-menu {
            right: calc(100% + 5px);
        }

        .menu-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 0.9rem;
            color: var(--text-dark);
            transition: background-color 0.2s;
        }

        .menu-item:hover {
            background-color: var(--primary-light);
        }

        .menu-item.delete-option {
            color: var(--danger); /* Red color for delete action */
        }
        
        .menu-item svg {
            margin-right: 8px;
        }


        .no-messages {
          text-align: center;
          color: #888;
          font-style: italic;
          padding-top: 2rem;
        }

        .typing-indicator {
          font-style: italic;
          padding: 0 1rem 1rem 1rem;
          color: #555;
          font-size: 0.85rem;
        }

        .chat-input-form {
          padding: 1rem;
          background-color: var(--primary-light);
          border-top: 1px solid #dcdcdc;
        }

        .input-container {
          display: flex;
          align-items: center;
          background-color: var(--primary-lightest);
          border-radius: 20px;
          padding: 0.25rem;
          border: 1px solid #dcdcdc;
        }

        .message-input {
          flex-grow: 1;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          outline: none;
          font-size: 1rem;
          color: var(--text-dark);
        }
        
        .message-input::placeholder {
          color: #555;
        }

        .emoji-button, .send-button {
          background-color: transparent;
          border: none;
          cursor: pointer;
          color: var(--primary-dark);
          padding: 0.5rem;
          transition: color 0.2s, transform 0.2s;
        }

        .send-button:disabled {
          color: var(--primary-medium);
          cursor: not-allowed;
        }
        
        .emoji-button:hover, .send-button:hover:not(:disabled) {
          transform: scale(1.1);
        }

        .emoji-picker {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
          padding-top: 0.75rem;
        }

        .emoji-option {
          background: var(--primary-lightest);
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .emoji-option:hover {
          background-color: var(--primary-medium);
        }
        `}
      </style>

      {/* The onClose button is crucial for mobile full-screen view */}
      <div className="chat-header"> 
        <h3>Room Chat</h3>
        
        {/* Only show close button if it's a floating panel (i.e., onClose is provided) */}
        {onClose && (
            <button className="close-button" onClick={onClose} aria-label="Close chat">
                <X size={18} />
            </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation! 👋</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-wrapper ${isOwnMessage(message) ? 'own-message' : 'other-message'}`}
            >
              <div
                className={`message ${isOwnMessage(message) ? 'own-message' : 'other-message'} ${message.isPending ? 'is-pending' : ''}`}
              >
                <div className="message-header">
                  <span className="username">
                    {isOwnMessage(message) ? 'You' : message.username}
                  </span>
                  <span className="timestamp">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <div className="message-content">
                  {message.message}
                </div>
                {message.isPending && <small className='is-pending-label' style={{fontSize: '0.65rem', color: '#5a5a5a'}}> (Sending...)</small>}
              </div>

              {/* Message Options Button */}
              {canDelete(message) && (
                  <button
                      className={`message-options-btn ${menuMessageId === message.id ? 'active' : ''}`}
                      onClick={(e) => {
                          e.stopPropagation();
                          setMenuMessageId(menuMessageId === message.id ? null : message.id);
                      }}
                      aria-label="Message options"
                  >
                      <MoreVertical size={16} />
                  </button>
              )}

              {/* Context Menu */}
              {menuMessageId === message.id && (
                  <div className={`message-context-menu`} ref={menuRef}>
                      <div
                          className="menu-item delete-option"
                          onClick={() => handleDeleteClick(message.id)}
                      >
                          <Trash2 size={16} />
                          <span>Delete Message</span>
                      </div>
                  </div>
              )}

            </div>
          ))
        )}
        {typingUsers.length > 0 && (
            <div className="typing-indicator">
                {typingUsers.map(user => user.username).join(', ')} is typing...
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-container">
          <button
            type="button"
            className="emoji-button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Add emoji"
          >
            <Smile size={20} />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
            maxLength={500}
          />
          
          <button
            type="submit"
            className="send-button"
            disabled={!inputMessage.trim()}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>

        {showEmojiPicker && (
          <div className="emoji-picker">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                className="emoji-option"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatPanel;