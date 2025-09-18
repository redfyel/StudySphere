import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { MdClose } from "react-icons/md";
import "./PdfReader.css";

// Import your PDF files directly from the src/assets/pdfs directory
import mathNotes from "../../assets/pdfs/mathNotes.pdf";
// Assuming you have these files, update the paths accordingly
// import chemistryGuide from "../../assets/pdfs/chemistryGuide.pdf";
// import algebraSheet from "../../assets/pdfs/algebraSheet.pdf";

export default function PdfReader() {
  const { id } = useParams();

  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerIntervalRef = useRef(null);

  // Hardcoded average time for UI demonstration purposes
  const avgTime = "00:05:30";

  // This object holds all PDF URLs and their associated titles
  const resources = {
    1: { id: 1, url: mathNotes, title: "Math Notes" },
    3: { id: 3, url: mathNotes, title: "Chemistry Guide" },
    5: { id: 5, url: mathNotes, title: "Algebra Cheat Sheet" },
  };
  const currentResource = resources[id];

  useEffect(() => {
    if (isActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    } else if (!isActive && timer !== 0) {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isActive, timer]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimer(0);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!currentResource) {
    return <div className="loading-state">Resource not found.</div>;
  }

  return (
    <div className="pdf-reader-container">
      <div className="reader-header">
        <Link to="/resources" className="back-btn">← Back to Resources</Link>
        <div className="pdf-title-and-timer">
          <h2 className="pdf-title">{currentResource.title}</h2>
          <div className="avg-time">
            Avg. reading time: <span>{avgTime}</span>
          </div>
        </div>
        <button onClick={() => window.history.back()} className="close-btn">
          <MdClose size={24} />
        </button>
      </div>
      <div className="pdf-and-timer-container">
        <div className="pdf-document-container">
          <iframe
            src={currentResource.url}
            title={currentResource.title}
            width="100%"
            height="100%"
            style={{ border: "none" }}
          >
            This browser does not support PDFs.
          </iframe>
        </div>
        <div className="timer-card">
          <div className="timer-header">Study Timer</div>
          <div className="timer-display">{formatTime(timer)}</div>
          <div className="timer-actions">
            <button className="timer-btn" onClick={toggleTimer}>
              {isActive ? 'Stop' : 'Start'}
            </button>
            <button className="timer-btn" onClick={resetTimer}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}