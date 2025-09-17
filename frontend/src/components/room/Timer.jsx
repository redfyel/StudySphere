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
      <h3>Study Timer</h3>
      <div className="timer-display">{displayTime}</div>
      <div className="timer-controls">
        <button onClick={toggleTimer}>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer}>Reset</button>
      </div>
    </div>
  );
}

export default Timer;