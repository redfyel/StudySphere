import React, { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

const ChatPanel = ({ 
  messages, 
  onSendMessage, 
  onFileShare, 
  currentUserId, 
  currentUsername 
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      setIsTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      onFileShare(file);
      e.target.value = ''; // Reset file input
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadFile = (fileData, fileName) => {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImageFile = (fileType) => {
    return fileType.startsWith('image/');
  };

  const renderMessage = (message) => {
    const isOwn = message.userId === currentUserId;
    const showAvatar = !isOwn;

    if (message.type === 'file') {
      return (
        <div key={message.id} className={`message-item ${isOwn ? 'own' : 'other'}`}>
          {showAvatar && (
            <div className="message-avatar">
              {message.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">{message.username}</span>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
            <div className="file-message">
              {isImageFile(message.fileType) ? (
                <div className="image-preview">
                  <img 
                    src={message.fileData} 
                    alt={message.fileName}
                    onClick={() => downloadFile(message.fileData, message.fileName)}
                  />
                </div>
              ) : (
                <div className="file-info">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <div className="file-name">{message.fileName}</div>
                    <div className="file-size">{formatFileSize(message.fileSize || 0)}</div>
                  </div>
                </div>
              )}
              <button 
                className="download-button"
                onClick={() => downloadFile(message.fileData, message.fileName)}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`message-item ${isOwn ? 'own' : 'other'}`}>
        {showAvatar && (
          <div className="message-avatar">
            {message.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="message-content">
          <div className="message-header">
            <span className="message-sender">{message.username}</span>
            <span className="message-time">{formatTime(message.timestamp)}</span>
          </div>
          <div className="message-text">{message.message}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Chat</h3>
        <span className="message-count">{messages.length}</span>
      </div>
      
      <div className="messages-container">
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="no-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="chat-input-container">
        <form onSubmit={handleSendMessage} className="chat-form">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input"
              maxLength={500}
            />
            <div className="input-actions">
              <button
                type="button"
                className="file-button"
                onClick={() => fileInputRef.current?.click()}
                title="Share file"
              >
                📎
              </button>
              <button
                type="submit"
                className="send-button"
                disabled={!inputMessage.trim()}
                title="Send message"
              >
                ➤
              </button>
            </div>
          </div>
        </form>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="*/*"
        />
        
        {isTyping && (
          <div className="typing-indicator">
            <span className="char-count">{inputMessage.length}/500</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;