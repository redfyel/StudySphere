import React, { useState, useEffect } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';

import ViewSwitcher from './ViewSwitcher';
import StudyVibeLogger from './StudyVibeLogger';
import DailyMoodLogger from './DailyMoodLogger';
import ChartCard from './ChartCard';
import './MoodTracker.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const MoodTracker = () => {
  // --- State Management ---
  const [selectedView, setSelectedView] = useState('week'); // 'day', 'week', 'month'

  // --- Chart Data States (These would be populated from actual user data) ---
  const [weeklyStudyTrendsData, setWeeklyStudyTrendsData] = useState({
    labels: [],
    datasets: [],
  });
  const [moodMeterData, setMoodMeterData] = useState({
    labels: [],
    datasets: [],
  });
  const [currentInsight, setCurrentInsight] = useState("Insight: Log your moods to see trends!");

  // --- Effects for Data Loading/Updating ---
  useEffect(() => {
    // In a real app, you'd fetch data here based on `selectedView`
    // and process it for your charts.
    // For now, we'll use dummy chart data placeholders.
    const generateDummyChartData = () => {
      // Dummy data for Weekly Study Vibe Trends
      const labels = Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`); // Example for a week
      setWeeklyStudyTrendsData({
        labels,
        datasets: [
          {
            label: 'Focused',
            data: labels.map(() => Math.floor(Math.random() * 60)), // Dummy percentage
            borderColor: '#60a5fa', // Blue
            backgroundColor: 'rgba(96, 165, 250, 0.2)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Accomplished',
            data: labels.map(() => Math.floor(Math.random() * 50)), // Dummy percentage
            borderColor: '#34d399', // Green
            backgroundColor: 'rgba(52, 211, 153, 0.2)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Burnt Out',
            data: labels.map(() => Math.floor(Math.random() * 40)), // Dummy percentage
            borderColor: '#ef4444', // Red
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            tension: 0.4,
            fill: true,
          },
        ],
      });

      // Dummy data for Mood Meter (Overall Daily Vibe)
      setMoodMeterData({
        labels: ['Happy', 'Balanced', 'Neutral', 'Stressed'],
        datasets: [{
          data: [30, 25, 20, 25], // Dummy percentages
          backgroundColor: ['#fde047', '#34d399', '#94a3b8', '#f87171'],
          hoverBackgroundColor: ['#facc15', '#10b981', '#64748b', '#ef4444'],
        }]
      });

      // Update dummy insight
      if (selectedView === 'week') {
        setCurrentInsight("Insight: You were most focused on Tuesday afternoons. Try scheduling deep work then!");
      } else if (selectedView === 'day') {
        setCurrentInsight("Insight: Reflect on your highs and lows today!");
      } else {
        setCurrentInsight("Insight: Consistent positive moods this month! Keep up the good habits!");
      }

    };

    generateDummyChartData();
  }, [selectedView]); // Recalculate if the view changes

  // --- Handlers ---
  const handleLogStudyVibe = ({ vibe, subject }) => {
    // In a real app:
    // 1. Send selectedStudyVibe, studySubject, and timestamp to your backend/local storage.
    console.log('Logging Study Vibe:', {
      vibe,
      subject,
      timestamp: new Date().toISOString(),
    });
    // 2. Potentially reset form fields and update charts.
    alert('Study Vibe Logged!'); // Placeholder for a nice toast notification
  };

  const handleLogOverallMood = ({ mood, notes }) => {
    // In a real app:
    // 1. Send selectedOverallMood, overallMoodNotes, and timestamp to your backend/local storage.
    console.log('Logging Overall Mood:', {
      mood,
      notes,
      timestamp: new Date().toISOString(),
    });
    // 2. Potentially reset form fields and update charts.
    alert('Daily Mood Logged!'); // Placeholder
  };

  // --- Inline Styles (for demonstration, extract to CSS Modules or Tailwind) ---
  const styles = {
    pageContainer: {
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      background: 'linear-gradient(135deg, #FAF9EE, #CBDCEB)', // Soft gradient background
      minHeight: '100vh',
      padding: '40px',
      color: '#333',
    },
    viewSwitcher: {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '40px',
    },
    viewButton: {
      padding: '10px 20px',
      borderRadius: '20px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1em',
      backgroundColor: '#f0f0f0',
      color: '#555',
      transition: 'all 0.3s ease',
    },
    viewButtonActive: {
      backgroundColor: '#6D94C5', // A vibrant purple for active
      color: 'white',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    cardTitle: {
      fontSize: '1.4em',
      fontWeight: '600',
      marginBottom: '20px',
      color: '#333',
    },
    studyVibeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '15px',
      marginBottom: '20px',
    },
    studyVibeCard: {
      background: '#f0f4f8',
      borderRadius: '15px',
      padding: '15px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '2px solid transparent',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100px',
    },
    studyVibeCardSelected: {
      borderColor: '#8a2be2',
      boxShadow: '0 4px 12px rgba(138, 43, 226, 0.2)',
      transform: 'scale(1.03)',
    },
    studyVibeIcon: {
      fontSize: '2em',
      marginBottom: '5px',
    },
    studyVibeLabel: {
      fontWeight: 'bold',
      fontSize: '0.9em',
      marginBottom: '3px',
    },
    studyVibeDesc: {
      fontSize: '0.75em',
      color: '#666',
    },
    inputField: {
      width: '100%',
      padding: '12px',
      borderRadius: '10px',
      border: '1px solid #ddd',
      fontSize: '1em',
      marginBottom: '15px',
      boxSizing: 'border-box',
    },
    textArea: {
      width: '100%',
      padding: '12px',
      borderRadius: '10px',
      border: '1px solid #ddd',
      fontSize: '1em',
      minHeight: '80px',
      marginBottom: '15px',
      boxSizing: 'border-box',
      resize: 'vertical',
    },
    logButton: {
      padding: '12px 25px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: '#8a2be2',
      color: 'white',
      fontSize: '1em',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      alignSelf: 'flex-end',
    },
    logButtonHover: {
      backgroundColor: '#7a1ad1',
    },
    overallMoodSliderContainer: {
      marginBottom: '20px',
    },
    overallMoodDisplay: {
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '15px',
    },
    overallMoodLabel: {
      fontSize: '1.2em',
      fontWeight: '600',
      color: '#555',
    },
    chartContainer: {
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    },
    chartPlaceholder: {
      height: '300px', // Placeholder height for charts
      backgroundColor: '#f9f9f9',
      borderRadius: '10px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#999',
      fontSize: '1.2em',
      border: '1px dashed #e0e0e0',
    },
    insightBox: {
      backgroundColor: '#e6f4f1',
      borderRadius: '10px',
      padding: '15px',
      marginTop: '20px',
      fontSize: '0.95em',
      color: '#2d6a5d', 
      borderLeft: '5px solid #38b2ac', 
    },
    footer: {
      textAlign: 'center',
      marginTop: '50px',
      fontSize: '0.9em',
      color: '#666',
    }
  };


  return (
    <div style={styles.pageContainer}>
      <ViewSwitcher selectedView={selectedView} setSelectedView={setSelectedView} styles={styles} />

      <div style={styles.gridContainer}>
        <StudyVibeLogger onLog={handleLogStudyVibe} styles={styles} />

        <DailyMoodLogger onLog={handleLogOverallMood} styles={styles} />

        <ChartCard
          title="Weekly Study Vibe Trends"
          chartComponent={<Line data={weeklyStudyTrendsData} options={{ maintainAspectRatio: false }} />}
          insight={currentInsight}
          styles={styles}
          gridColumn="span 2"
        />

        <ChartCard
          title="Your Mood Meter"
          chartComponent={<Pie data={moodMeterData} options={{ maintainAspectRatio: false }} />}
          styles={styles}
        >
          <button
            onClick={() => alert("Navigate to Full Analytics Page!")}
            style={{ ...styles.logButton, marginTop: '20px', alignSelf: 'center', backgroundColor: '#6b7280' }} // Grey button for analytics
          >
            View Full Analytics
          </button>
        </ChartCard>
      </div>

      <footer style={styles.footer}>
        <p>&copy; StudySphere. Visualize Your Journey.</p>
      </footer>
    </div>
  );
};

export default MoodTracker;