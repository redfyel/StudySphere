import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FaSyncAlt,
  FaArrowLeft,
  FaArrowRight,
  FaEdit,
  FaFire,
  FaPlus,
  FaLayerGroup,
  FaStar,
  FaChartBar,
  FaCog,
} from "react-icons/fa";
import { GiCardRandom } from "react-icons/gi";
import { FaRocket } from "react-icons/fa";
import { IoCreateOutline } from "react-icons/io5";
import { BsCollectionFill, BsLightningFill } from "react-icons/bs";
import { FaUserFriends } from "react-icons/fa";
import Sidebar from "../../sidebar/Sidebar"; // Assuming path to your Sidebar component
import "./FlashcardView.css"; // Import the dedicated CSS

// --- FlashcardsView Component ---
const FlashcardsView = () => {
  const location = useLocation();
  // Safely destructure, providing an empty object as a fallback
  const { generatedFlashcards } = location.state || {};

  // --- STATE MANAGEMENT ---
  const [flashcards, setFlashcards] = useState(generatedFlashcards || []);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [masteredCards, setMasteredCards] = useState(new Set());
  const [forgotCards, setForgotCards] = useState(new Set());
  const [streak, setStreak] = useState(0); // Assuming streak is managed elsewhere in a real app
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentCard =
    flashcards.length > 0 ? flashcards[currentCardIndex] : null;
  const totalCards = flashcards.length;

  // --- EFFECTS ---
  // Flip the card back to the question when the index changes
  useEffect(() => {
    setShowAnswer(false);
  }, [currentCardIndex]);

  // Load new flashcards when they are passed via location state
  useEffect(() => {
    if (generatedFlashcards && generatedFlashcards.length > 0) {
      setFlashcards(generatedFlashcards);
      setCurrentCardIndex(0);
      setMasteredCards(new Set());
      setForgotCards(new Set());
    }
  }, [generatedFlashcards]);

  // --- COMPONENT LOGIC & HANDLERS ---
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Define the comprehensive sidebar structure
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
        {
          name: "Settings",
          path: "/study-enhance/settings",
          icon: <FaCog />,
        },
      ],
    },
  ];

  const handleNextCard = (mastered) => {
    if (!currentCard) return;

    // Update mastered/forgot sets based on user feedback
    if (mastered) {
      setMasteredCards((prev) => new Set(prev).add(currentCard.id));
      setForgotCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentCard.id);
        return newSet;
      });
    } else {
      setForgotCards((prev) => new Set(prev).add(currentCard.id));
      setMasteredCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentCard.id);
        return newSet;
      });
    }

    setShowAnswer(false); // Ensure the next card starts on the question side

    // Move to the next card or end the session
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Replace alert with a more user-friendly modal in a future update
      alert(
        `Deck Completed! Mastered: ${masteredCards.size + 1}, Forgot: ${
          forgotCards.size
        }`
      );
      // Reset for a new session
      setCurrentCardIndex(0);
      setMasteredCards(new Set());
      setForgotCards(new Set());
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && currentCard) {
      const updatedFlashcards = flashcards.map((card) =>
        card.id === currentCard.id
          ? { ...card, tags: [...(card.tags || []), newTagInput.trim()] }
          : card
      );
      setFlashcards(updatedFlashcards);
      setNewTagInput("");
      setIsAddingTag(false);
    }
  };

  // Calculate progress for the progress bar
  const cardsReviewed = masteredCards.size + forgotCards.size;
  const progressPercentage =
    totalCards > 0 ? ((cardsReviewed + 1) / totalCards) * 100 : 0;

  // --- RENDER ---

  // Display a message if no flashcards are available
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="sidebar-page-layout">
        <Sidebar
          sectionName="Smart Flashcards"
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
          items={sidebarItems}
        />
        <div
          className={`sidebar-page-content ${isCollapsed ? "collapsed" : ""}`}
        >
          <div className="flashcard-study-container no-cards-message">
            <h2>No Flashcards to Display</h2>
            <p>
              Go to the <a href="/study-enhance/generate">AI Generation</a>{" "}
              screen to create a new deck!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-page-layout">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        items={sidebarItems}
      />

      <div className={`sidebar-page-content ${isCollapsed ? "collapsed" : ""}`}>
        <div className="flashcard-study-container">
          {/* Header with Title and Stats */}
          <div className="flashcard-header-area">
            <h2 className="flashcard-header-title">Study Session</h2>
            <div className="flashcard-header-stats">
              <span>
                <FaFire className="streak-icon" /> {streak}-Day Streak
              </span>
              <div className="flashcard-progress-bar-wrapper">
                <div
                  className="flashcard-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span>
                {currentCardIndex + 1}/{totalCards}
              </span>
            </div>
          </div>

          {/* Main Card Display Area */}
          <div className="flashcard-card-display">
            {currentCard ? (
              <div
                className={`flashcard-card-item ${
                  showAnswer ? "is-flipped" : ""
                }`}
                onClick={() => setShowAnswer(!showAnswer)}
              >
                {/* --- CARD FRONT --- */}
                <div className="flashcard-card-face flashcard-card-face-front">
                  <div className="flashcard-card-content">
                    <p className="flashcard-card-question">
                      {currentCard.question}
                    </p>
                  </div>
                  {/* Tags Logic */}
                  <div className="flashcard-card-tags-container">
                    {currentCard.tags?.map((tag, index) => (
                      <span key={index} className="flashcard-tag-pill">
                        {tag}
                      </span>
                    ))}
                    {isAddingTag ? (
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                        onClick={(e) => e.stopPropagation()} // Prevent card from flipping
                        placeholder="New tag..."
                        className="tag-input"
                        autoFocus
                      />
                    ) : (
                      <button
                        className="flashcard-tag-add-button"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card from flipping
                          setIsAddingTag(true);
                        }}
                      >
                        <FaPlus />
                      </button>
                    )}
                  </div>
                </div>

                {/* --- CARD BACK --- */}
                <div className="flashcard-card-face flashcard-card-face-back">
                  <div className="flashcard-card-content">
                    <p className="flashcard-card-answer">
                      {currentCard.answer}
                    </p>
                  </div>
                  {/* Tags can be repeated on the back for context if desired */}
                  <div className="flashcard-card-tags-container">
                    {currentCard.tags?.map((tag, index) => (
                      <span key={index} className="flashcard-tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading card...</p> // Fallback message
            )}

            {/* "Show Answer" button appears before the card is flipped */}
            {!showAnswer && currentCard && (
              <button
                className="flashcard-action-button flashcard-action-show-answer"
                onClick={() => setShowAnswer(true)}
              >
                Show Answer
              </button>
            )}
          </div>

          {/* "Forgot" and "Got It" buttons appear after the card is flipped */}
          {showAnswer && currentCard && (
            <div className="flashcard-action-buttons">
              <button
                className="flashcard-action-button flashcard-action-forgot"
                onClick={() => handleNextCard(false)}
              >
                <FaArrowLeft /> Forgot
              </button>
              <button
                className="flashcard-action-button flashcard-action-got-it"
                onClick={() => handleNextCard(true)}
              >
                Got It <FaArrowRight />
              </button>
            </div>
          )}

          {/* Footer with future feature buttons */}
          <div className="flashcard-navigation-footer">
            <button className="flashcard-footer-button">
              <FaSyncAlt /> Study Modes
            </button>
            <button className="flashcard-footer-button">
              <FaEdit /> Edit Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsView;
