import React, { useState, useEffect, useCallback } from "react";
import { Bar, Bubble, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import axios from "axios";
import ChartCard from "./ChartCard";
// ❌ You can remove this import as it's no longer used for the month view
// import CalendarHeatmap from "react-calendar-heatmap";
// import "react-calendar-heatmap/dist/styles.css";
import { Tooltip as ReactTooltip } from "react-tooltip";
import CommandBar from "./CommandBar";
import WeeklyMoodStrip from "./WeeklyMoodStrip"; // This is still used for the 'week' view
import "./AnalyticsSection.css";
import "./Wellness.css";
// ✅ NEW: Import the new component and its CSS
import MonthlyMoodGrid from "./MonthlyMoodGrid";
import "./MonthlyMoodGrid.css";

// --- COMPONENTS ---
const NoDataPlaceholder = () => (
    <div className="no-data-placeholder">
        <p>Not enough data</p>
        <span>Log your vibes and moods to see your analytics here.</span>
    </div>
);

// --- CHART LOGIC ---
ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler );

const getTimeframeDetails = (view, anchorDate) => {
    const d = new Date(anchorDate);
    let title = "";
    let startDate = new Date(d);
    let endDate = new Date(d);

    switch (view) {
        case "week":
            const firstDay = d.getDate() - d.getDay();
            startDate = new Date(d.setDate(firstDay));
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            const formattedStartDate = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const formattedEndDate = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            title = `Week of ${formattedStartDate} - ${formattedEndDate}`;
            break;
        case "month":
            startDate = new Date(d.getFullYear(), d.getMonth(), 1);
            endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            title = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            break;
        case "year":
            startDate = new Date(d.getFullYear(), 0, 1);
            endDate = new Date(d.getFullYear(), 11, 31);
            title = d.getFullYear().toString();
            break;
        default:
          break;
    }
    return { title, startDate, endDate };
};

const transformLogsForCharts = (logs, view) => {
    const studyLogs = logs.filter(l => l.type === 'vibe');
    const moodLogs = logs.filter(l => l.type === 'mood');
    let studyData = { type: 'no-data', subtitle: 'No Data Logged' };
    let moodData = { type: 'no-data', subtitle: 'No Data Logged' };
    const vibeColors = { energized: '#BDE4A8', focused: '#F7E5A5', accomplished: '#A9D6E5', calm: '#D3B8E3', overwhelmed: '#FFC0CB', burntout: '#F0A3A9' };
    const allVibes = ['energized', 'focused', 'accomplished', 'calm', 'overwhelmed', 'burntout'];
    const sharedOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top', labels: { color: '#3b525b', font: { size: 14 }}}},
        scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b' }},
            y: { grid: { color: '#e5e1da' }, ticks: { color: '#64748b' }, beginAtZero: true }
        }
    };

    switch (view) {
        case 'week':
            if (studyLogs.length > 0) {
                studyData = {
                    type: 'bubble',
                    subtitle: 'Weekly Study Rhythm',
                    data: { datasets: [{ label: 'Study Session', data: studyLogs.map(log => { const d = new Date(log.createdAt); return { x: d.getDay(), y: d.getHours() + d.getMinutes() / 60, r: 8, vibe: log.value.vibe }; }), backgroundColor: (context) => { const vibe = context.raw?.vibe; return vibe ? vibeColors[vibe] : '#cccccc'; }, }] },
                    options: { ...sharedOptions, scales: { y: { min: 6, max: 24, title: { text: 'Time of Day', display: true } }, x: { ticks: { callback: (val) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][val] }}}}
                };
            }
            if (moodLogs.length > 0) {
                moodData = { type: 'weekly-strip', subtitle: 'Weekly Mood Heatmap', data: moodLogs.map(log => ({ date: new Date(log.createdAt), mood: typeof log.value === 'string' ? log.value : log.value.mood })) };
            }
            break;
        case 'month':
            if (studyLogs.length > 0) {
                const weeklyVibeCounts = {};
                allVibes.forEach(v => { weeklyVibeCounts[v] = [0, 0, 0, 0]; });
                studyLogs.forEach(log => { const weekOfMonth = Math.floor((new Date(log.createdAt).getDate() - 1) / 7); if (weeklyVibeCounts[log.value.vibe]) { weeklyVibeCounts[log.value.vibe][weekOfMonth]++; } });
                studyData = {
                    type: 'bar',
                    subtitle: 'Monthly Vibe Breakdown',
                    data: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], datasets: allVibes.map(vibe => ({ label: vibe.charAt(0).toUpperCase() + vibe.slice(1), data: weeklyVibeCounts[vibe], backgroundColor: vibeColors[vibe], })).filter(ds => ds.data.some(d => d > 0)) },
                    options: { ...sharedOptions, scales: { ...sharedOptions.scales, x: { ...sharedOptions.scales.x, stacked: true }, y: { ...sharedOptions.scales.y, stacked: true }}}
                };
            }
            if (moodLogs.length > 0) {
                moodData = { type: 'heatmap', subtitle: 'Monthly Mood Calendar', data: moodLogs.map(log => ({ date: new Date(log.createdAt), mood: typeof log.value === 'string' ? log.value : log.value.mood })) };
            }
            break;
        case 'year':
        // 1. Study: Stacked Bar Chart
        if (studyLogs.length > 0) {
            const monthlyVibeCounts = {}; // e.g. { focused: [10, 5, ...], ... }
            allVibes.forEach(v => { monthlyVibeCounts[v] = Array(12).fill(0); });

            studyLogs.forEach(log => {
                const month = new Date(log.createdAt).getMonth();
                if (monthlyVibeCounts[log.value.vibe]) {
                    monthlyVibeCounts[log.value.vibe][month]++;
                }
            });

            studyData = {
                type: 'bar',
                subtitle: 'Yearly Vibe Breakdown',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: allVibes.map(vibe => ({
                        label: vibe.charAt(0).toUpperCase() + vibe.slice(1),
                        data: monthlyVibeCounts[vibe],
                        backgroundColor: vibeColors[vibe], // This was also already correct
                    })).filter(ds => ds.data.some(d => d > 0))
                },
                options: { ...sharedOptions, scales: { ...sharedOptions.scales, x: { ...sharedOptions.scales.x, stacked: true }, y: { ...sharedOptions.scales.y, stacked: true }}}
            };
        }
        // 2. Mood: Yearly Trendline
        if (moodLogs.length > 1) { // Need at least 2 points for a line
            const moodRank = { Stressed: 1, Down: 2, Neutral: 3, Balanced: 4, Happy: 5, Awesome: 6 };
            const monthlyAverages = Array(12).fill(null).map(() => ({ total: 0, count: 0 }));
            moodLogs.forEach(log => {
                const month = new Date(log.createdAt).getMonth();
                if (moodRank[log.value]) {
                    monthlyAverages[month].total += moodRank[log.value];
                    monthlyAverages[month].count++;
                }
            });

            moodData = {
                type: 'line',
                subtitle: 'Yearly Mood Trend',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Average Monthly Mood',
                        data: monthlyAverages.map(m => m.count > 0 ? (m.total / m.count).toFixed(2) : null),
                        borderColor: '#89A8B2',
                        backgroundColor: '#B3C8CF',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: { ...sharedOptions, scales: { ...sharedOptions.scales, y: { ...sharedOptions.scales.y, min: 1, max: 6 }}}
            };
        }
        break;
        default:
            break;
    }
    return { study: studyData, mood: moodData };
};


// --- MAIN COMPONENT ---
const AnalyticsSection = () => {
    const [selectedView, setSelectedView] = useState("week");
    const [anchorDate, setAnchorDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState({ study: null, mood: null });

    const fetchAnalyticsData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { startDate, endDate } = getTimeframeDetails(selectedView, anchorDate);
            const token = localStorage.getItem("token");
            const config = { headers: { "x-auth-token": token } };
            const res = await axios.get(`https://studysphere-n4up.onrender.com//api/wellness/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, config);
            setChartData(transformLogsForCharts(res.data, selectedView));
        } catch (err) {
            console.error("Failed to fetch analytics data", err);
            setChartData({ study: { type: "no-data", title: "Study Analysis" }, mood: { type: "no-data", title: "Mood Analysis" } });
        } finally {
            setIsLoading(false);
        }
    }, [selectedView, anchorDate]);

    useEffect(() => { fetchAnalyticsData(); }, [fetchAnalyticsData]);

    const { title, startDate, endDate } = getTimeframeDetails(selectedView, anchorDate);

    const renderChart = (chartInfo) => {
        if (!chartInfo || chartInfo.type === 'no-data') return <NoDataPlaceholder />;

        switch (chartInfo.type) {
            case 'bubble': return <Bubble data={chartInfo.data} options={chartInfo.options} />;
            case 'bar': return <Bar data={chartInfo.data} options={chartInfo.options} />;
            case 'line': return <Line data={chartInfo.data} options={chartInfo.options} />;
            case 'weekly-strip':
                return <WeeklyMoodStrip startDate={startDate} moodData={chartInfo.data} />;
            
            // ✅ CHANGED: This case now renders your new custom component
            case 'heatmap':
                return (
                    <>
                        <MonthlyMoodGrid 
                            startDate={startDate}
                            endDate={endDate}
                            moodData={chartInfo.data}
                        />
                        <ReactTooltip id="heatmap-tooltip" />
                    </>
                );
            default:
                return <NoDataPlaceholder />;
        }
    };

    return (
        <section className="charts-analytics-section">
            <h2 className="section-title">Your Vibe Analytics</h2>
            <CommandBar
                selectedView={selectedView}
                setSelectedView={setSelectedView}
                anchorDate={anchorDate}
                setAnchorDate={setAnchorDate}
                title={title}
            />
            {isLoading ? (
                <p className="loading-text">Brewing your insights...</p>
            ) : (
                <div className="analytics-dashboard-grid">
                     <ChartCard
                        title="Study Session Analysis"
                        subtitle={chartData.study?.subtitle}
                    >
                        {renderChart(chartData.study)}
                    </ChartCard>
                    <ChartCard
                        title="Daily Mood Analysis"
                        subtitle={chartData.mood?.subtitle}
                        backgroundText={selectedView === 'month' ? new Date(anchorDate).toLocaleDateString('en-US', { month: 'short' }) : null}
                    >
                        {renderChart(chartData.mood)}
                    </ChartCard>
                    <ReactTooltip id="mood-strip-tooltip" />
                </div>
            )}
        </section>
    );
};

export default AnalyticsSection;    