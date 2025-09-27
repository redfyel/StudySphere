import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { MdClose } from "react-icons/md";
import "./PdfReader.css";
import axios from "axios";
import { UserLoginContext } from "../../contexts/UserLoginContext";
import Loading from "../loading/Loading";
import ErrorMessage from '../errormessage/ErrorMessage';

export default function PdfReader() {
  const { id } = useParams();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useContext(UserLoginContext);

  const [resource, setResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // The error state will now hold an object { message, details } or null
  const [error, setError] = useState(null);

  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerIntervalRef = useRef(null);

  // Hardcoded average time for UI demonstration purposes
  const avgTime = "00:05:30";

  useEffect(() => {
    if (!isAuthLoading) { 
        const fetchResource = async () => {
          if (!isAuthenticated || !token) {
            setIsLoading(false);
            // --- CHANGE #1: Set error state to an object ---
            setError({
              message: "You must be logged in to view this resource.",
              details: { status: 401, reason: "Authentication token not found." }
            });
            return;
          }
          try {
            const res = await axios.get(`https://studysphere-n4up.onrender.com/api/resources/${id}`);
            setResource(res.data);
            setIsLoading(false);
          } catch (err) {
            console.error("Error fetching resource:", err);
            // --- CHANGE #2: Set error state to an object with technical details ---
            setError({
              message: "Failed to load the resource. It might not exist or you may not have access.",
              details: err.response?.data || { error: err.message } // Capture backend error or generic message
            });
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
    // Note: Your Loading component was designed without a 'text' prop. 
    // You might want to add that or remove the prop here.
    return <Loading text = "Loading your resource..."/>;
  }
  
  // --- CHANGE #3: This code now works perfectly ---
  // It correctly reads the .message and .details properties from the error object
  if (error) {
    return <ErrorMessage message={error.message} details={error.details} />;
  }

  if (!resource) {
    // This can be a simple message or you can also use your ErrorMessage component
    return <ErrorMessage message="Resource not found." title="404 - Not Found" />;
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