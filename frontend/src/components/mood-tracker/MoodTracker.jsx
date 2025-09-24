import React, { useState, useEffect } from "react";
import { Line, Pie } from "react-chartjs-2";
import {Chart as ChartJS,CategoryScale,LinearScale,PointElement,LineElement,ArcElement,Tooltip,Legend,Filler,} from "chart.js";
import ViewSwitcher from "./ViewSwitcher"; // This will become our "timeframe pill menu" for charts
import StudyVibeLogger from "./StudyVibeLogger";
import DailyMoodLogger from "./DailyMoodLogger";
import ChartCard from "./ChartCard";
import "./MoodTracker.css";
import PrimaryNavTabs from "../tabs/PrimaryNavTabs"; 
import { useToast } from "../../contexts/ToastProvider";
import Toast from "../toast/Toast";

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
  // New state for primary navigation: 'logging' or 'analytics'
  const [currentSection, setCurrentSection] = useState("logging");

  // State for chart timeframes (used within 'analytics' section)
  const [selectedView, setSelectedView] = useState("week"); // 'day', 'week', 'month', 'year'

  const [weeklyStudyTrendsData, setWeeklyStudyTrendsData] = useState({
    labels: [],
    datasets: [],
  });
  const [moodMeterData, setMoodMeterData] = useState({
    labels: [],
    datasets: [],
  });
  const [currentInsight, setCurrentInsight] = useState(
    "Log your moods and study vibes to uncover powerful insights!"
  );

  const { toast, showToast } = useToast();

  useEffect(() => {
    // Only generate chart data if we are in the analytics section or about to switch to it
    if (currentSection === "Analyse your Vibe") {
      const generateDummyChartData = () => {
        let labels = [];
        let dataPointsCount = 0;

        switch (selectedView) {
          case "day":
            labels = ["Morning", "Afternoon", "Evening", "Night"];
            dataPointsCount = 4;
            break;
          case "week":
            labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            dataPointsCount = 7;
            break;
          case "month":
            labels = Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
            dataPointsCount = 4;
            break;
          case "year":
            labels = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            dataPointsCount = 12;
            break;
          default:
            labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            dataPointsCount = 7;
        }

        setWeeklyStudyTrendsData({
          labels,
          datasets: [
            {
              label: "Focused",
              data: Array.from(
                { length: dataPointsCount },
                () => Math.floor(Math.random() * 60) + 20
              ),
              borderColor: "#51A8FF",
              backgroundColor: "rgba(81, 168, 255, 0.2)",
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "#51A8FF",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "#51A8FF",
            },
            {
              label: "Accomplished",
              data: Array.from(
                { length: dataPointsCount },
                () => Math.floor(Math.random() * 50) + 10
              ),
              borderColor: "#34D399",
              backgroundColor: "rgba(52, 211, 153, 0.2)",
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "#34D399",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "#34D399",
            },
            {
              label: "Burnt Out",
              data: Array.from(
                { length: dataPointsCount },
                () => Math.floor(Math.random() * 30) + 5
              ),
              borderColor: "#FF7A7A",
              backgroundColor: "rgba(255, 122, 122, 0.2)",
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "#FF7A7A",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "#FF7A7A",
            },
          ],
        });

        setMoodMeterData({
          labels: ["Happy", "Content", "Neutral", "Stressed", "Sad"],
          datasets: [
            {
              data: [25, 20, 15, 25, 15].map(
                (val) => val * (Math.random() * 0.5 + 0.75)
              ),
              backgroundColor: [
                "#FACC15",
                "#34D399",
                "#94A3B8",
                "#FF7A7A",
                "#60A5FA",
              ],
              hoverOffset: 8,
              borderWidth: 1,
              borderColor: "#fff",
            },
          ],
        });

        if (selectedView === "week") {
          setCurrentInsight(
            "Insight: This week shows a strong 'Focused' trend on mid-week days. Leverage these peak times!"
          );
        } else if (selectedView === "day") {
          setCurrentInsight(
            "Insight: Your mood was highest in the morning today. Start your key tasks early!"
          );
        } else if (selectedView === "month") {
          setCurrentInsight(
            "Insight: Overall positive mood consistency this month. Keep reinforcing those good habits!"
          );
        } else if (selectedView === "year") {
          setCurrentInsight(
            "Insight: A generally productive year with peak performance in Q3. Time to set new goals!"
          );
        }
      };

      generateDummyChartData();
    }
  }, [selectedView, currentSection]); // Re-run effect when selectedView OR currentSection changes

  const handleLogStudyVibe = (data) => {
    console.log("Logging Study Vibe:", data);
    showToast("Study Vibe Logged! 🚀", "info");
    // In a real app, you would dispatch this data to your global state/backend
    // and then potentially refetch analytics if the user switches to 'analytics'
  };

  const handleLogOverallMood = (data) => {
    console.log("Logging Overall Mood:", data);
    showToast("Daily Mood Logged! 😊", "info");
    // In a real app, you would dispatch this data to your global state/backend
  };

  return (
    <div className="mood-tracker-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => showToast(null)}
        />
      )}
      <header className="mood-tracker-header">
        <h1>How are you feeling today?</h1>
        {/* Primary navigation: Logging vs. Analytics */}
        <PrimaryNavTabs
          tabs={["Log Your Vibe", "Analyse your Vibe"]}
          activeTab={currentSection}
          onTabClick={setCurrentSection}
        />
      </header>

      <main className="moodashboard-content">
        {/* Changed from dashboard-grid */}
        {currentSection === "Log Your Vibe" && (
          <section className="logger-section">
            <h2 className="section-title">Current State Loggers</h2>

            {/* New container for side-by-side layout */}
            <div className="loggers-container">
              <StudyVibeLogger onLog={handleLogStudyVibe} />
              <DailyMoodLogger onLog={handleLogOverallMood} />
            </div>
          </section>
        )}

        {currentSection === "Analyse your Vibe" && (
          <section className="charts-analytics-section">
            {" "}
            {/* New section for analytics content */}
            <h2 className="section-title">Your Vibe Analytics</h2>
            {/* Pill menu (ViewSwitcher) for chart timeframes */}
            <ViewSwitcher
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              views={["day", "week", "month", "year"]}
            />
            <div className="analytics-charts-grid">
              {" "}
              {/* Grid for charts within analytics */}
              <ChartCard
                title={`Study Vibe Trends (${
                  selectedView.charAt(0).toUpperCase() + selectedView.slice(1)
                })`}
                chartComponent={
                  <Line
                    data={weeklyStudyTrendsData}
                    options={{ maintainAspectRatio: false, responsive: true }}
                  />
                }
                insight={currentInsight}
                className="chart-card-large"
              />
              <ChartCard
                title={`Overall Mood Distribution (${
                  selectedView.charAt(0).toUpperCase() + selectedView.slice(1)
                })`}
                chartComponent={
                  <Pie
                    data={moodMeterData}
                    options={{ maintainAspectRatio: false, responsive: true }}
                  />
                }
                insight="Understand the breakdown of your emotions over this period."
              >
                <button
                  onClick={() => showToast("Navigating to detailed analytics...", "info")}
                  className="view-analytics-button"
                >
                  View Full Analytics
                </button>
              </ChartCard>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default MoodTracker;
