import React, { useState, useEffect } from "react";
import {
  FaSyncAlt,
  FaArrowLeft,
  FaArrowRight,
  FaEdit,
  FaFire,
  FaPlus,
} from "react-icons/fa";
import { GiCardRandom } from "react-icons/gi"; // example icons
// import { TbMindMap } from "react-icons/tb";
import { IoCreateOutline } from "react-icons/io5";
import Sidebar from "../sidebar/Sidebar"; // adjust path if needed
import "./studyEnhance.css";

// Mock data - In a real app, this would come from props or global state
const mockFlashcards = [
  { id: 1, question: "What is the capital of France?", answer: "Paris", tags: ["Geography", "Europe"] },
  { id: 2, question: "Define 'Photosynthesis'.", answer: "The process by which plants use sunlight to synthesize food.", tags: ["Biology"] },
  { id: 3, question: "Formula for water?", answer: "H₂O", tags: ["Chemistry"] },
];

const FlashcardsView = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [masteredCards, setMasteredCards] = useState(new Set());
  const [forgotCards, setForgotCards] = useState(new Set());
  const [streak] = useState(6); // Mock streak
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentCard = mockFlashcards[currentCardIndex];
  const totalCards = mockFlashcards.length;

  useEffect(() => {
    setShowAnswer(false);
  }, [currentCardIndex]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const sidebarItems = [
    { name: "All Flashcards", path: "/flashcards", icon: <GiCardRandom /> },
    { name: "Create Flashcards", path: "/flashcards/create", icon: <IoCreateOutline /> },
    { name: "Mind Maps", path: "/flashcards/mindmaps", icon: <IoCreateOutline /> },
  ];

  const handleNextCard = (mastered) => {
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

    setShowAnswer(false);

    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      alert(
        `Deck Completed! Mastered: ${masteredCards.size}, Forgot: ${forgotCards.size}`
      );
      setCurrentCardIndex(0);
      setMasteredCards(new Set());
      setForgotCards(new Set());
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && currentCard) {
      alert(`Tag "${newTagInput.trim()}" added (mock update)`);
      setNewTagInput("");
      setIsAddingTag(false);
    }
  };

  const cardsReviewed = masteredCards.size + forgotCards.size;
  const progressPercentage = (cardsReviewed / totalCards) * 100;

  return (
    <div className="sidebar-page-layout">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        items={sidebarItems}
        sectionName="Flashcards"
      />

      <div
        className={`sidebar-page-content ${isCollapsed ? "collapsed" : ""}`}
      >
        <div className="flashcards-view-container">
          <div className="flashcards-header">
            <h2>Flashcards for 'Biology Chapter 5'</h2>
            <div className="header-stats">
              <span>
                <FaFire /> {streak}-Day Streak
              </span>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span>
                {currentCardIndex + 1}/{totalCards}
              </span>
            </div>
          </div>

          <div className="flashcard-container">
            <div
              className="flashcard"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              <div className="flashcard-content">
                {!showAnswer ? (
                  <p className="flashcard-question">{currentCard.question}</p>
                ) : (
                  <p className="flashcard-answer">{currentCard.answer}</p>
                )}
              </div>

              {/* Tags Display */}
              <div className="flashcard-tags">
                {currentCard.tags &&
                  currentCard.tags.map((tag, index) => (
                    <span key={index} className="tag-item">
                      {tag}
                    </span>
                  ))}
                {isAddingTag ? (
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    placeholder="New tag"
                    className="tag-input"
                    autoFocus
                  />
                ) : (
                  <button
                    className="tag-add-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddingTag(true);
                    }}
                  >
                    <FaPlus /> Add Tag
                  </button>
                )}
              </div>
            </div>

            {!showAnswer && (
              <button
                className="action-button show-answer-button"
                onClick={() => setShowAnswer(true)}
              >
                Show Answer
              </button>
            )}
          </div>

          {showAnswer && (
            <div className="flashcard-actions">
              <button
                className="action-button forgot-button"
                onClick={() => handleNextCard(false)}
              >
                <FaArrowLeft /> Forgot
              </button>
              <button
                className="action-button got-it-button"
                onClick={() => handleNextCard(true)}
              >
                Got It <FaArrowRight />
              </button>
            </div>
          )}

          <div className="flashcards-footer">
            <button className="footer-button">
              <FaSyncAlt /> Study Modes
            </button>
            <button className="footer-button">
              <FaEdit /> Edit Card
            </button>
            <button className="footer-button">View as Mind Map</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsView;
