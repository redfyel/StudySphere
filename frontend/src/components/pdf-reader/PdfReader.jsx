import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { MdClose } from "react-icons/md";
import "./PdfReader.css";
import axios from "axios";
import { UserLoginContext } from "../../contexts/UserLoginContext";

export default function PdfReader() {
  const { id } = useParams();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useContext(UserLoginContext);

  const [resource, setResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerIntervalRef = useRef(null);

  // Hardcoded average time for UI demonstration purposes
  const avgTime = "00:05:30";

  // ✅ NEW: Fetch the specific resource from the backend
  useEffect(() => {
    // Only fetch if authentication state has been resolved
    if (!isAuthLoading) { 
        const fetchResource = async () => {
          if (!isAuthenticated || !token) {
            setIsLoading(false);
            setError("You must be logged in to view resources.");
            return;
          }
          try {
            const res = await axios.get(`http://localhost:5000/api/resources/${id}`);
            setResource(res.data);
            setIsLoading(false);
          } catch (err) {
            console.error("Error fetching resource:", err);
            setError("Failed to load resource. Please ensure you have access.");
            setIsLoading(false);
          }
        };
        fetchResource();
    }
  }, [id, token, isAuthenticated, isAuthLoading]);

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

  if (isLoading || isAuthLoading) {
    return <div className="loading-state">Loading resource...</div>;
  }
  
  if (error) {
    return <div className="loading-state">{error}</div>;
  }

  if (!resource) {
    return <div className="loading-state">Resource not found.</div>;
  }

  return (
    <div className="pdf-reader-container">
      <div className="reader-header">
        <Link to="/resources" className="back-btn">← Back to Resources</Link>
        <div className="pdf-header-placeholder"></div>
        <button onClick={() => window.history.back()} className="close-btn">
          <MdClose size={24} />
        </button>
      </div>
      <div className="pdf-and-timer-container">
        <div className="pdf-document-container">
          {resource.resourceType === 'file' ? (
            <iframe
              src={resource.fileURL}
              title={resource.title}
              width="100%"
              height="100%"
              style={{ border: "none" }}
            >
              This browser does not support PDFs.
            </iframe>
          ) : (
            <div className="unsupported-resource-view">
              <h3>This resource is a {resource.resourceType}</h3>
              <p>You can access it by clicking the link below.</p>
              <a href={resource.linkURL} target="_blank" rel="noopener noreferrer">
                Open Resource Link
              </a>
            </div>
          )}
        </div>
        <div className="side-panel-container">
          <div className="pdf-title-card">
            <h2 className="pdf-title">{resource.title}</h2>
            <div className="avg-time">
              Avg. reading time: <span>{avgTime}</span>
            </div>
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
    </div>
  );
}
