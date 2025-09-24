import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import './ErrorMessage.css';

const ErrorMessage = ({
  title = "Oops! Something went wrong.",
  message,
  className = '',
  details = {}
}) => {
  // If there's no message, don't render the component.
  if (!message) {
    return null;
  }

  return (
    <div className={`error-message-container ${className}`}>
      <div className="error-message-icon">
        <FaExclamationTriangle />
      </div>
      <div className="error-message-content">
        <h4 className="error-message-title">{title}</h4>
        <p className="error-message-text">{message}</p>
        <div className="error-message-details">
          <div className="error-message-details-box">
            <pre>{JSON.stringify(details, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;  