import React, { useState } from 'react';
import { FaRegSmile, FaBolt, FaHourglassHalf, FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './TodaysLogSummary.css';

const getMoodClass = (mood) => {
    if (!mood) return 'neutral';
    return mood.toLowerCase();
};

const TodaysLogSummary = ({ logs }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const moodLog = logs.find(l => l.type === 'mood');
    const vibeLogs = logs.filter(l => l.type === 'vibe');

    // Don't render the component at all if nothing has been logged.
    if (logs.length === 0) {
        return null;
    }

    return (
        <div className="debrief-container">
            {/* THE CLICKABLE HEADER (COLLAPSED STATE) */}
            <button className="debrief-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="header-content">
                    <span className="header-title">Today's Debrief</span>
                    <div className="header-summary-text">
                        {moodLog && (
                            <>
                                <span>Mood: <strong>{moodLog.value}</strong></span>
                                <span className="separator">|</span>
                            </>
                        )}
                        <span>{vibeLogs.length} Study Session{vibeLogs.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                <FaChevronDown className={`chevron-icon ${isExpanded ? 'expanded' : ''}`} />
            </button>

            {/* THE EXPANDABLE CONTENT */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="debrief-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        {/* We reuse the sleek two-card layout from before */}
                        <div className="summary-card-grid">
                            {moodLog && (
                                <div className={`summary-card mood-card mood-card-${getMoodClass(moodLog.value)}`}>
                                    <div className="mood-card-content">
                                        <h2 className="mood-value">{moodLog.value}</h2>
                                        <p className="mood-label">Today's Overall Mood</p>
                                    </div>
                                </div>
                            )}
                            {vibeLogs.length > 0 && (
                                <div className="summary-card vibe-card">
                                    <ul className="vibe-timeline">
                                        {vibeLogs.slice().reverse().map(log => (
                                            <li key={log._id} className="vibe-timeline-item">
                                                <FaBolt className="vibe-icon" />
                                                <div className="vibe-details">
                                                    <span className="vibe-name">{log.value.vibe}</span>
                                                    {log.value.subject && <span className="vibe-subject">{log.value.subject}</span>}
                                                </div>
                                                <div className="vibe-item-spacer"></div>
                                                <time className="vibe-time">
                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </time>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TodaysLogSummary;