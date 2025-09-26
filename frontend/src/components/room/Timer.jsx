import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Clock, Plus, Minus } from 'lucide-react';

function Timer() {
  const [activeTab, setActiveTab] = useState('stopwatch');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  
  // Timer specific states
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [initialTime, setInitialTime] = useState(0);

  // Stopwatch logic
  useEffect(() => {
    let interval;
    if (isRunning && activeTab === 'stopwatch') {
      interval = setInterval(() => {
        setTime((prev) => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeTab]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isRunning && activeTab === 'timer' && time > 0) {
      interval = setInterval(() => {
        setTime((prev) => {
          if (prev <= 10) {
            setIsRunning(false);
            playAlarm();
            return 0;
          }
          return prev - 10;
        });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning, time, activeTab]);

  const playAlarm = useCallback(() => {
    // Play multiple beeps for better attention
    const playBeep = (frequency, duration, delay = 0) => {
      setTimeout(() => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      }, delay);
    };

    // Play a sequence of beeps
    playBeep(880, 0.2, 0);    // First beep
    playBeep(880, 0.2, 300);  // Second beep
    playBeep(880, 0.2, 600);  // Third beep
    playBeep(1100, 0.4, 900); // Final longer beep
  }, []);

  const toggle = () => {
    if (activeTab === 'timer' && time === 0) {
      // If timer is at 0, start with set time
      startTimer();
    } else {
      setIsRunning(!isRunning);
    }
  };

  const reset = () => {
    setIsRunning(false);
    if (activeTab === 'stopwatch') {
      setTime(0);
      setLaps([]);
    } else {
      // For timer, reset to 0 to show setup again
      setTime(0);
      setInitialTime(0);
    }
  };

  const addLap = () => {
    if (time > 0) {
      setLaps(prev => [time, ...prev]);
    }
  };

  const startTimer = () => {
    const totalMs = (timerHours * 3600 + timerMinutes * 60 + timerSeconds) * 1000;
    setTime(totalMs);
    setInitialTime(totalMs);
    setIsRunning(true);
  };

  const adjustTime = (unit, delta) => {
    if (unit === 'hours') {
      setTimerHours(Math.max(0, Math.min(23, timerHours + delta)));
    } else if (unit === 'minutes') {
      setTimerMinutes(Math.max(0, Math.min(59, timerMinutes + delta)));
    } else {
      setTimerSeconds(Math.max(0, Math.min(59, timerSeconds + delta)));
    }
  };

  const formatTime = (ms, showMs = false) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    // Always show hours for stopwatch, only show when needed for timer
    if (activeTab === 'stopwatch' || hours > 0) {
      return showMs 
        ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
        : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return showMs
      ? `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatLapTime = (currentTime, previousTime) => {
    const lapTime = previousTime - currentTime;
    return formatTime(lapTime, true);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setIsRunning(false);
    setLaps([]);
    if (tab === 'timer') {
      // Reset timer to allow setting new time
      setTime(0);
      setInitialTime(0);
    } else {
      setTime(0);
    }
  };

  const getProgress = () => {
    if (activeTab === 'timer' && initialTime > 0) {
      return ((initialTime - time) / initialTime) * 100;
    }
    return 0;
  };

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '320px', 
      margin: '20px auto', 
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
      backgroundColor: '#F1F0E8',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(137, 168, 178, 0.3)',
      border: '1px solid rgba(179, 200, 207, 0.2)'
    }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: '#E5E1DA',
        position: 'relative'
      }}>
        {['stopwatch', 'timer'].map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            style={{
              flex: 1,
              padding: '16px 12px',
              border: 'none',
              backgroundColor: activeTab === tab ? '#F1F0E8' : 'transparent',
              color: activeTab === tab ? '#89A8B2' : '#B3C8CF',
              fontWeight: activeTab === tab ? '600' : '500',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textTransform: 'capitalize',
              borderRadius: activeTab === tab ? '12px 12px 0 0' : '0'
            }}
          >
            {tab === 'stopwatch' ? <Clock size={16} /> : <TimerIcon size={16} />}
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px' }}>
        {/* Timer Display */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '32px',
          position: 'relative'
        }}>
          {activeTab === 'timer' && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '4px',
              backgroundColor: '#E5E1DA',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#89A8B2',
                width: `${getProgress()}%`,
                transition: 'width 0.1s linear',
                borderRadius: '2px'
              }} />
            </div>
          )}
          
          <div style={{
            fontSize: activeTab === 'stopwatch' && time > 0 ? '2.5rem' : '2.8rem',
            fontWeight: '400',
            color: '#6B8A94',
            letterSpacing: '0.5px',
            marginTop: '16px',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatTime(time, activeTab === 'stopwatch')}
          </div>
          
          <div style={{
            fontSize: '12px',
            color: '#8FA5AF',
            marginTop: '8px',
            fontWeight: '500'
          }}>
            {isRunning ? 'RUNNING' : (time > 0 ? 'PAUSED' : 'READY')}
          </div>
        </div>

        {/* Timer Setup */}
        {activeTab === 'timer' && !isRunning && time === 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#8FA5AF',
              marginBottom: '16px',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Set Timer Duration
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              {[
                { label: 'Hours', value: timerHours, unit: 'hours' },
                { label: 'Minutes', value: timerMinutes, unit: 'minutes' },
                { label: 'Seconds', value: timerSeconds, unit: 'seconds' }
              ].map(({ label, value, unit }) => (
                <div key={unit} style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => adjustTime(unit, 1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: '#E5E1DA',
                      color: '#89A8B2',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(137, 168, 178, 0.2)'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#B3C8CF'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#E5E1DA'}
                  >
                    <Plus size={16} />
                  </button>
                  
                  <div style={{
                    textAlign: 'center',
                    minHeight: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backgroundColor: '#E5E1DA',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    minWidth: '60px'
                  }}>
                    <div style={{
                      fontSize: '1.8rem',
                      fontWeight: '600',
                      color: '#6B8A94',
                      lineHeight: '1.2'
                    }}>
                      {value.toString().padStart(2, '0')}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#8FA5AF',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginTop: '2px'
                    }}>
                      {label}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => adjustTime(unit, -1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: '#E5E1DA',
                      color: '#89A8B2',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(137, 168, 178, 0.2)'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#B3C8CF'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#E5E1DA'}
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Quick Timer Presets */}
            <div style={{ 
              marginTop: '20px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {[
                { label: '1m', h: 0, m: 1, s: 0 },
                { label: '5m', h: 0, m: 5, s: 0 },
                { label: '10m', h: 0, m: 10, s: 0 },
                { label: '15m', h: 0, m: 15, s: 0 },
                { label: '30m', h: 0, m: 30, s: 0 },
                { label: '1h', h: 1, m: 0, s: 0 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setTimerHours(preset.h);
                    setTimerMinutes(preset.m);
                    setTimerSeconds(preset.s);
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #E5E1DA',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: '#8FA5AF',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#E5E1DA';
                    e.target.style.color = '#6B8A94';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#8FA5AF';
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          marginBottom: activeTab === 'stopwatch' && laps.length > 0 ? '24px' : '0'
        }}>
          <button
            onClick={toggle}
            style={{
              flex: 2,
              padding: '14px',
              border: 'none',
              borderRadius: '12px',
              backgroundColor: isRunning ? '#B3C8CF' : '#89A8B2',
              color: '#F1F0E8',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(137, 168, 178, 0.2)'
            }}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? 'Pause' : (activeTab === 'timer' && time === 0 ? 'Start' : 'Resume')}
          </button>
          
          {activeTab === 'stopwatch' && time > 0 && (
            <button
              onClick={addLap}
              style={{
                flex: 1,
                padding: '14px',
                border: '2px solid #E5E1DA',
                borderRadius: '12px',
                backgroundColor: 'transparent',
                color: '#89A8B2',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Lap
            </button>
          )}
          
          <button
            onClick={reset}
            style={{
              flex: 1,
              padding: '14px',
              border: '2px solid #E5E1DA',
              borderRadius: '12px',
              backgroundColor: 'transparent',
              color: '#89A8B2',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Laps */}
        {activeTab === 'stopwatch' && laps.length > 0 && (
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #E5E1DA',
            borderRadius: '12px',
            padding: '12px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#8FA5AF',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Laps ({laps.length})
            </div>
            {laps.map((lap, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < laps.length - 1 ? '1px solid #E5E1DA' : 'none',
                  fontSize: '14px'
                }}
              >
                <span style={{ color: '#8FA5AF', fontWeight: '500' }}>
                  #{laps.length - index}
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#6B8A94', fontWeight: '600' }}>
                    {formatTime(lap, true)}
                  </div>
                  {index < laps.length - 1 && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#8FA5AF',
                      fontWeight: '500'
                    }}>
                      +{formatLapTime(lap, laps[index + 1])}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Timer;