import React from 'react';
import './Loading.css';

const loadingMessages = [
  "Cultivating your focus...",
  "Gathering your resources...",
  "Connecting with your study group...",
  "Great things are loading...",
  "Take a deep breath. You've got this.",
];

const Loading = ({text}) => {
  const randomIndex = Math.floor(Math.random() * loadingMessages.length);
  const message = text || loadingMessages[randomIndex];

  return (
    <div className="c-loading-container">
      <div className="synapse-animation">
        <div className="central-hub"></div>
        <div className="node node-1"></div>
        <div className="node node-2"></div>
        <div className="node node-3"></div>
      </div>
      <p className="c-loading-text">{message}</p>
    </div>
  );
};

export default Loading;