// frontend/src/components/flashcards/FlashcardView.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  FaSyncAlt,
  FaArrowLeft,
  FaStar,
  FaChartBar,
  FaCog,
  FaCheck,
  FaTimes,
  FaRocket,
  FaUserFriends,
  FaLayerGroup,
} from "react-icons/fa";
import { BsCollectionFill, BsLightningFill } from "react-icons/bs";
import Sidebar from "../../sidebar/Sidebar";
import axios from "axios";
import "./FlashcardView.css";

// --- A Sleeker, More Elegant SessionComplete Component ---
const SessionComplete = ({ mastered, forgot, onRestart }) => (
  <div className="session-complete-container">
    <div className="completion-card">
      <div className="completion-star-pulse">
        <FaStar />
      </div>
      <h1>Session Complete</h1>
      <p>Great work! Consistency is the key to mastery.</p>
      <div className="session-stats">
        <div className="stat-item mastered">
          <span className="stat-number">{mastered}</span>
          <span className="stat-label">Mastered</span>
        </div>
        <div className="stat-item forgot">
          <span className="stat-number">{forgot}</span>
          <span className="stat-label">Needs Review</span>
        </div>
      </div>
      <div className="completion-actions">
        <button className="restart-session-button" onClick={onRestart}>
          <FaSyncAlt /> Study Again
        </button>
        <Link to="/study-enhance/decks" className="back-to-decks-link">
          Choose Another Deck
        </Link>
      </div>
    </div>
  </div>
);

// --- The Revolutionized FlashcardsView Component ---
const FlashcardsView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { generatedFlashcards, deckTitle = "Study Session" } =
    location.state || {};
  const deckId = location.state?.deckId || null; // ✅ NEW: Capture deckId if passed

  const [flashcards, setFlashcards] = useState(generatedFlashcards || []);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState(new Set());
  const [forgotCards, setForgotCards] = useState(new Set());
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cardAnimation, setCardAnimation] = useState("enter");

  const currentCard =
    flashcards.length > 0 ? flashcards[currentCardIndex] : null;
  const totalCards = flashcards.length;

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const resetSession = useCallback(() => {
    setCurrentCardIndex(0);
    setMasteredCards(new Set());
    setForgotCards(new Set());
    setIsFlipped(false);
    setIsSessionComplete(false);
    setCardAnimation("enter");
  }, []);

  useEffect(() => {
    if (generatedFlashcards && generatedFlashcards.length > 0) {
      setFlashcards(generatedFlashcards);
      resetSession();
    } else {
      setFlashcards([]);
    }
  }, [generatedFlashcards, resetSession]);

  // ✅ NEW: Function to log the session to the backend
  const logStudySession = async (finalMastered, finalForgot) => {
    // Don't log if there's no deckId
    // if (!deckId) {
    //   console.warn(
    //     "No deckId was provided to the study session. Skipping log."
    //   );
    //   return;
    // }

    const token = localStorage.getItem("token");
    const config = { headers: { "x-auth-token": token } };
    const body = {
      masteredCount: finalMastered.size,
      forgotCount: finalForgot.size,
    };

    try {
      await axios.post(
        `http://localhost:5000/api/flashcards/decks/${deckId}/sessions`,
        body,
        config
      );
      console.log("Study session logged successfully!");
    } catch (err) {
      console.error("Failed to log study session:", err);
    }
  };

  const handleNextCard = (mastered) => {
    if (!currentCard || cardAnimation.startsWith("exit")) return;

    // We need to create the final sets here before the state updates
    const finalMastered = new Set(masteredCards);
    const finalForgot = new Set(forgotCards);
    const cardId = currentCard.id || currentCard._id;

    if (mastered) {
      finalMastered.add(cardId);
    } else {
      finalForgot.add(cardId);
    }

    // Update state for the UI
    setMasteredCards(finalMastered);
    setForgotCards(finalForgot);

    setCardAnimation(mastered ? "exit-right" : "exit-left");

    setTimeout(() => {
      setIsFlipped(false);
      if (currentCardIndex < totalCards - 1) {
        setCurrentCardIndex((prevIndex) => prevIndex + 1);
        setCardAnimation("enter");
      } else {
        // ✅ SESSION ENDS: Log the results and then show completion screen
        logStudySession(finalMastered, finalForgot);
        setIsSessionComplete(true);
      }
    }, 500);
  };

  const sidebarItems = [
    {
      section: "Study",
      items: [
        {
          name: "Start Studying",
          path: "/study-enhance/flashcards/session",
          icon: <BsLightningFill />,
        },
        {
          name: "Review Mastered",
          path: "/study-enhance/flashcards/review",
          icon: <FaStar />,
        },
      ],
    },
    {
      section: "Library",
      items: [
        {
          name: "All Decks",
          path: "/study-enhance/decks",
          icon: <BsCollectionFill />,
        },
        {
          name: "Shared Flashcards",
          path: "/study-enhance/flashcards/shared",
          icon: <FaUserFriends />,
        },
      ],
    },
    {
      section: "Create",
      items: [
        {
          name: "Generate with AI",
          path: "/study-enhance/generate",
          icon: <FaRocket />,
        },
        {
          name: "Mind Maps",
          path: "/study-enhance/mindmaps",
          icon: <FaLayerGroup />,
        },
      ],
    },
    {
      section: "Analytics",
      items: [
        {
          name: "Statistics",
          path: "/study-enhance/stats",
          icon: <FaChartBar />,
        },
        { name: "Settings", path: "/study-enhance/settings", icon: <FaCog /> },
      ],
    },
  ];

  const progressPercentage =
    totalCards > 0 ? ((currentCardIndex + 1) / totalCards) * 100 : 0;

  const renderContent = () => {
    if (!flashcards || flashcards.length === 0) {
      return (
        <div className="study-environment no-cards-message">
          <h2>No Deck Loaded</h2>
          <p>
            Create a new deck with AI or choose one from your library to start
            studying.
          </p>
          <Link to="/study-enhance/generate" className="create-deck-button">
            <FaRocket /> Generate New Deck
          </Link>
        </div>
      );
    }
    if (isSessionComplete) {
      return (
        <SessionComplete
          mastered={masteredCards.size}
          forgot={forgotCards.size}
          onRestart={resetSession}
        />
      );
    }
    return (
      <div className="study-environment">
        <div className="study-deck-container">
          <header className="study-header">
            <div className="header-top-row">
              <button
                className="back-button"
                onClick={() => navigate("/study-enhance/decks")}
              >
                <FaArrowLeft />
              </button>
              <h1 className="deck-title">{deckTitle}</h1>
              <span className="card-counter">
                {currentCardIndex + 1}/{totalCards}
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </header>

          <main className="card-display-area">
            <div
              className={`flashcard-card-item animation-${cardAnimation} ${
                isFlipped ? "is-flipped" : ""
              }`}
              // Line in FlashcardsView.jsx
              onClick={() =>
                !cardAnimation.startsWith("exit") &&
                !isFlipped &&
                setIsFlipped(true)
              } // Prevent flip during exit animation
            >
              <div className="flashcard-card-face card-face-front">
                <span className="face-label">Question</span>
                <p className="card-content-text question-text">
                  {currentCard?.question}
                </p>
              </div>
              <div className="flashcard-card-face card-face-back">
                <span className="face-label">Answer</span>
                <p className="card-content-text answer-text">
                  {currentCard?.answer}
                </p>
              </div>
            </div>
          </main>

          <footer className={`study-footer ${isFlipped ? "visible" : ""}`}>
            <button
              className="confidence-button forgot"
              onClick={() => handleNextCard(false)}
            >
              <FaTimes />
            </button>
            <button
              className="confidence-button got-it"
              onClick={() => handleNextCard(true)}
            >
              <FaCheck />
            </button>
          </footer>
        </div>
      </div>
    );
  };

  //  if (!deckId || !generatedFlashcards || generatedFlashcards.length === 0) {
  //   return (
  //     <div className="sidebar-page-layout">
  //       <Sidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} items={[]} />
  //       <div className={`sidebar-page-content ${isCollapsed ? "collapsed" : ""}`}>
  //          <div className="study-environment no-cards-message">
  //             <h2>No Study Session Found</h2>
  //             <p>It looks like there's no deck loaded. Please start a session from your decks library.</p>
  //             <Link to="/study-enhance/decks" className="create-deck-button">
  //               <FaArrowLeft /> Back to Decks
  //             </Link>
  //           </div>
  //       </div>
  //     </div>
  //   );
  // }
  return (
    <div className="sidebar-page-layout">
      <Sidebar
        sectionName={"Smart Flashcards"}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        items={sidebarItems}
      />
      <div className={`sidebar-page-content ${isCollapsed ? "collapsed" : ""}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default FlashcardsView;
