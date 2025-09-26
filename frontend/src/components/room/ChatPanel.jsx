import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Smile, MoreVertical } from 'lucide-react';

const ChatPanel = ({ 
  messages = [], 
  onSendMessage, 
  currentUserId, 
  onClose,
  typingUsers = [],
  embedded = true,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const commonEmojis = ['😊', '😂', '👍', '❤️', '😢', '😮', '😡', '🎉', '👏', '🔥', '💯', '🤔', '😴', '🙄', '💪', '🎯', '✨', '👀', '🥳', '😎', '🤩', '👋', '✌️', '🙌', '🙏', '🤯', '😬', '🫠', '🤖', '👾', '🚀', '⭐'];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
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

  return (
    <div className={`chat-panel-container ${embedded ? 'embedded' : ''}`}>
      <style>
        {`
        /* --- Color Palette --- */
        /* #89a8b2 (Dark Blue-Gray) - Primary */
        /* #b3c8cf (Light Blue-Gray) - Accent */
        /* #e5e1da (Light Beige) - Background */
        /* #f1f0e8 (Off-White) - Message/Input background */

        .chat-panel-container {
          position: fixed;
          right: 0;
          top: 20px;
          bottom: 0;
          width: 350px;
          display: flex;
          flex-direction: column;
          background-color: #e5e1da;
          color: #1a1a1a;
          border-left: 1px solid #dcdcdc;
          font-family: 'Inter', sans-serif;
          transition: transform 0.3s ease-in-out;
          z-index: 1000;
          box-shadow: -4px 0 12px rgba(0,0,0,0.1);
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #89a8b2;
          color: #f1f0e8;
          border-bottom: 1px solid #7a94a2;
          border-top-left-radius: 12px;
          border-bottom-left-radius: 0px;
        }

        .chat-header h3 {
          margin: 0;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          color: #f1f0e8;
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

        .message {
          max-width: 85%;
          padding: 0.75rem 1rem;
          border-radius: 18px;
          line-height: 1.4;
          word-wrap: break-word;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          position: relative;
          color: #1a1a1a;
        }

        .message.own-message {
          align-self: flex-end;
          background-color: #b3c8cf;
          color: #1a1a1a;
          border-bottom-right-radius: 4px;
        }

        .message.other-message {
          align-self: flex-start;
          background-color: #f1f0e8;
          color: #1a1a1a;
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
          background-color: #e5e1da;
          border-top: 1px solid #dcdcdc;
        }

        .input-container {
          display: flex;
          align-items: center;
          background-color: #f1f0e8;
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
          color: #1a1a1a;
        }
        
        .message-input::placeholder {
          color: #555;
        }

        .emoji-button, .send-button {
          background-color: transparent;
          border: none;
          cursor: pointer;
          color: #89a8b2;
          padding: 0.5rem;
          transition: color 0.2s, transform 0.2s;
        }

        .send-button:disabled {
          color: #b3c8cf;
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
          background: #f1f0e8;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .emoji-option:hover {
          background-color: #b3c8cf;
        }
        `}
      </style>

      {/* The onClose button will only be visible if you pass the prop 'embedded=false' or use this component outside the tab structure */}
      <div className="chat-header"> 
        <h3>Chat</h3>
        
          <button className="close-button" onClick={onClose} aria-label="Close chat">
            <X size={18} />
          </button>
        
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${isOwnMessage(message) ? 'own-message' : 'other-message'}`}
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
