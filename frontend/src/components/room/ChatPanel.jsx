import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Smile } from 'lucide-react';
import './ChatPanel.css';

const ChatPanel = ({ 
  messages, 
  onSendMessage, 
  currentUserId, 
  onClose 
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const commonEmojis = ['😊', '😂', '👍', '❤️', '😢', '😮', '😡', '🎉', '👏', '🔥', '💯', '🤔', '😴', '🙄', '💪', '🎯'];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="chat-panel">
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