import React, { useState } from 'react';
import PrimaryNavTabs from '../tabs/PrimaryNavTabs';
import { useToast } from '../../contexts/ToastProvider';
import Toast from '../toast/Toast';
import LoggingSection from './LoggingSection';
import AnalyticsSection from './AnalyticsSection';
import './Wellness.css'; 

const WellnessPage = () => {
  const [currentSection, setCurrentSection] = useState("Log Your Vibe");
  const { toast, showToast, hideToast } = useToast();

  const handleDataLogged = (message, type) => {
    showToast(message, type);
  };

  return (
    <div className="wellness-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <header className="wellness-page-header">
        <h1>How are you feeling today?</h1>
        <PrimaryNavTabs
          tabs={["Log Your Vibe", "Analyse your Vibe"]}
          activeTab={currentSection}
          onTabClick={setCurrentSection}
        />
      </header>

      <main className="wellness-content">
        {currentSection === "Log Your Vibe" && (
          <LoggingSection onDataLogged={handleDataLogged} />
        )}
        {currentSection === "Analyse your Vibe" && (
          <AnalyticsSection />
        )}
      </main>
    </div>
  );
};

export default WellnessPage;