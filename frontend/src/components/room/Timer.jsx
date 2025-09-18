import React, { useState, useEffect } from 'react';

function Timer({ timer, onTimerChange }) {
  const [isRunning, setIsRunning] = useState(false);
  const [displayTime, setDisplayTime] = useState(formatTime(timer));

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        onTimerChange(timer + 1);
        setDisplayTime(formatTime(timer + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer, onTimerChange]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    onTimerChange(0);
    setDisplayTime(formatTime(0));
    setIsRunning(false);
  };

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="timer">
      <div className="timer-header">
        <h3 className="timer-title">Study Timer</h3>
        <div className="timer-status">
          {isRunning ? 'Running' : 'Paused'}
        </div>
      </div>
      
      <div className="timer-display-container">
        <div className="timer-display">{displayTime}</div>
        <div className="timer-labels">
          <span>HH</span>
          <span>MM</span>
          <span>SS</span>
        </div>
      </div>
      
      <div className="timer-controls">
        <button 
          onClick={toggleTimer}
          className={`timer-btn primary ${isRunning ? 'pause' : 'start'}`}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button 
          onClick={resetTimer}
          className="timer-btn secondary"
        >
          Reset
        </button>
      </div>

      <div className="timer-stats">
        <div className="stat-item">
          <span className="stat-label">Hours</span>
          <span className="stat-value">{Math.floor(timer / 3600)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Minutes</span>
          <span className="stat-value">{Math.floor((timer % 3600) / 60)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Sessions</span>
          <span className="stat-value">{Math.floor(timer / 1800)}</span>
        </div>
      </div>

      <style jsx>{`
        .timer {
          width: 100%;
          max-width: 280px;
          margin: 0 auto;
          padding: 20px;
          background: #F1F0E8;
          border: 1px solid #E5E1DA;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(137, 168, 178, 0.1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .timer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .timer-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #89A8B2;
        }

        .timer-status {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 6px;
          background: ${isRunning ? '#B3C8CF' : '#E5E1DA'};
          color: ${isRunning ? '#F1F0E8' : '#89A8B2'};
          font-weight: 500;
        }

        .timer-display-container {
          text-align: center;
          margin-bottom: 20px;
        }

        .timer-display {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 2.5rem;
          font-weight: 300;
          color: #89A8B2;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          padding: 16px;
          background: #F1F0E8;
          border: 2px solid #E5E1DA;
          border-radius: 8px;
          text-shadow: 0 1px 2px rgba(137, 168, 178, 0.1);
        }

        .timer-labels {
          display: flex;
          justify-content: space-around;
          font-size: 10px;
          color: #B3C8CF;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .timer-controls {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .timer-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .timer-btn.primary {
          background: #89A8B2;
          color: #F1F0E8;
        }

        .timer-btn.primary:hover {
          background: #B3C8CF;
          transform: translateY(-1px);
        }

        .timer-btn.primary.pause {
          background: #B3C8CF;
        }

        .timer-btn.primary.pause:hover {
          background: #89A8B2;
        }

        .timer-btn.secondary {
          background: #E5E1DA;
          color: #89A8B2;
        }

        .timer-btn.secondary:hover {
          background: #B3C8CF;
          color: #F1F0E8;
        }

        .timer-stats {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .stat-item {
          flex: 1;
          text-align: center;
          padding: 12px 8px;
          background: #E5E1DA;
          border-radius: 6px;
        }

        .stat-label {
          display: block;
          font-size: 10px;
          color: #B3C8CF;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #89A8B2;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        /* Responsive adjustments */
        @media (max-width: 320px) {
          .timer {
            max-width: 100%;
            padding: 16px;
          }

          .timer-display {
            font-size: 2rem;
            padding: 12px;
          }

          .timer-controls {
            flex-direction: column;
            gap: 8px;
          }

          .timer-stats {
            gap: 6px;
          }

          .stat-item {
            padding: 8px 4px;
          }

          .stat-value {
            font-size: 14px;
          }
        }

        @media (max-width: 280px) {
          .timer-display {
            font-size: 1.8rem;
          }

          .timer-header {
            flex-direction: column;
            gap: 8px;
            align-items: center;
          }

          .timer-stats {
            flex-direction: column;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}

export default Timer;