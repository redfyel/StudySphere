import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import StudyVibeLogger from './StudyVibeLogger';
import DailyMoodLogger from './DailyMoodLogger';
import TodaysLogSummary from './TodaysLogSummary'; // ✅ NEW: Import the summary component
import { useToast } from '../../contexts/ToastProvider';

const LoggingSection = ({ onDataLogged }) => {
    const { showToast } = useToast();
    const [todaysLogs, setTodaysLogs] = useState([]);

    const fetchTodaysLogs = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const today = new Date();
            const startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString();
            const res = await axios.get(`https://studysphere-n4up.onrender.com/api/wellness/logs?startDate=${startDate}&endDate=${endDate}`, config);
            setTodaysLogs(res.data);
        } catch (err) {
            console.error("Could not fetch today's logs.", err);
        }
    }, []);

    useEffect(() => {
        fetchTodaysLogs();
    }, [fetchTodaysLogs]);

    const handleLogStudyVibe = async (data) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const body = { type: 'vibe', value: data };
            await axios.post('https://studysphere-n4up.onrender.com/api/wellness/log', body, config);
            onDataLogged("Study Vibe Logged!", "info");
            fetchTodaysLogs(); // ✅ Refresh logs immediately
        } catch (err) {
            onDataLogged("Could not save your vibe log.", "error");
        }
    };

    const handleLogOverallMood = async (data) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const body = { type: 'mood', value: data.mood.label, notes: data.notes };
            await axios.post('https://studysphere-n4up.onrender.com/api/wellness/log', body, config);
            showToast("Daily Mood Logged!", "info");
            fetchTodaysLogs(); // ✅ Refresh logs immediately
        } catch (err) {
            showToast("Could not save your mood log.", "error");
        }
    };

    // ✅ Determine if mood has been logged for today
    const dailyMoodLogged = todaysLogs.some(log => log.type === 'mood');

    return (
        <section className="logger-section">
            {/* ✅ Display today's logs at the top */}
            <TodaysLogSummary logs={todaysLogs} />

            <div className="loggers-container">
                <StudyVibeLogger onLog={handleLogStudyVibe} />
                <DailyMoodLogger 
                    onLog={handleLogOverallMood} 
                    isLoggedToday={dailyMoodLogged} // Pass down the boolean
                />
            </div>
        </section>
    );
};

export default LoggingSection;