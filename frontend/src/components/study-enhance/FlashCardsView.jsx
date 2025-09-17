import React, { useState, useEffect } from 'react';
import { FaSyncAlt, FaArrowLeft, FaArrowRight, FaEdit, FaFire, FaPlus, FaTag, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './studyEnhance.css'; // Import the CSS file

// Mock data - In a real app, this would come from props or a global state
const mockFlashcards = [
    { id: 1, question: "What is the capital of France?", answer: "Paris", tags: ["Geography", "Europe"] },
    { id: 2, question: "Define 'Photosynthesis'.", answer: "The process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.", tags: ["Biology"] },
    { id: 3, question: "Formula for water?", answer: "H₂O", tags: ["Chemistry", "Basic"] },
    { id: 4, question: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare", tags: ["Literature", "History"] },
    { id: 5, question: "What is the largest ocean on Earth?", answer: "Pacific Ocean", tags: ["Geography"] },
    { id: 6, question: "What is the powerhouse of the cell?", answer: "Mitochondria", tags: ["Biology"] },
    { id: 7, question: "What is the chemical symbol for gold?", answer: "Au", tags: ["Chemistry"] },
];

const FlashcardsView = () => {
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [masteredCards, setMasteredCards] = useState(new Set()); // Using Set for efficient tracking
    const [forgotCards, setForgotCards] = useState(new Set());
    const [streak, setStreak] = useState(6); // Mock streak
    const [isAddingTag, setIsAddingTag] = useState(false); // State for tag input visibility
    const [newTagInput, setNewTagInput] = useState('');

    const currentCard = mockFlashcards[currentCardIndex];
    const totalCards = mockFlashcards.length;

    useEffect(() => {
        // Reset showAnswer when card changes
        setShowAnswer(false);
    }, [currentCardIndex]);

    const handleNextCard = (mastered) => {
        if (mastered) {
            setMasteredCards(prev => new Set(prev).add(currentCard.id));
            setForgotCards(prev => { // If marked as mastered, remove from forgot
                const newSet = new Set(prev);
                newSet.delete(currentCard.id);
                return newSet;
            });
        } else {
            setForgotCards(prev => new Set(prev).add(currentCard.id));
            setMasteredCards(prev => { // If marked as forgot, remove from mastered
                const newSet = new Set(prev);
                newSet.delete(currentCard.id);
                return newSet;
            });
        }
        
        setShowAnswer(false);

        if (currentCardIndex < totalCards - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        } else {
            alert(`Deck Completed! Mastered: ${masteredCards.size}, Forgot: ${forgotCards.size}`);
            setCurrentCardIndex(0); // Reset for demo
            setMasteredCards(new Set());
            setForgotCards(new Set());
        }
    };

    const handleAddTag = () => {
        // In a real app, you'd update the current card's tags in your data source
        // For mock data, we'll just log it for now
        if (newTagInput.trim() && currentCard) {
            console.log(`Adding tag "${newTagInput.trim()}" to card ${currentCard.id}`);
            // This would typically involve updating `mockFlashcards` or a state
            // For this demo, we'll visually show the tag without persistent state update
            // A more robust solution would involve proper state management for mockFlashcards
            alert(`Tag "${newTagInput.trim()}" added to current card (mock update)`);
            setNewTagInput('');
            setIsAddingTag(false);
        }
    };

    const cardsReviewed = masteredCards.size + forgotCards.size;
    const progressPercentage = (cardsReviewed / totalCards) * 100;

    return (
        <div className="flashcards-view-container">
            <div className="flashcards-header">
                <h2>Flashcards for 'Biology Chapter 5'</h2>
                <div className="header-stats">
                    <span><FaFire /> {streak}-Day Streak</span>
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <span>{currentCardIndex + 1}/{totalCards}</span>
                </div>
            </div>

            <div className="flashcard-container">
                <div className="flashcard" onClick={() => setShowAnswer(!showAnswer)}>
                    <div className="flashcard-content">
                        {!showAnswer ? (
                            <p className="flashcard-question">{currentCard.question}</p>
                        ) : (
                            <p className="flashcard-answer">{currentCard.answer}</p>
                        )}
                    </div>
                    {/* Tags Display */}
                    <div className="flashcard-tags">
                        {currentCard.tags && currentCard.tags.map((tag, index) => (
                            <span key={index} className="tag-item">{tag}</span>
                        ))}
                        {isAddingTag ? (
                            <input
                                type="text"
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                onBlur={() => { /* setIsAddingTag(false); */ }} // Optionally close on blur
                                placeholder="New tag"
                                className="tag-input"
                                autoFocus
                            />
                        ) : (
                            <button className="tag-add-button" onClick={(e) => { e.stopPropagation(); setIsAddingTag(true); }}>
                                <FaPlus /> Add Tag
                            </button>
                        )}
                    </div>
                </div>

                {!showAnswer && (
                    <button className="action-button show-answer-button" onClick={() => setShowAnswer(true)}>Show Answer</button>
                )}
            </div>

            {showAnswer && (
                <div className="flashcard-actions">
                    <button className="action-button forgot-button" onClick={() => handleNextCard(false)}>
                        <FaArrowLeft /> Forgot
                    </button>
                    <button className="action-button got-it-button" onClick={() => handleNextCard(true)}>
                        Got It <FaArrowRight />
                    </button>
                </div>
            )}

            <div className="flashcards-footer">
                <button className="footer-button"><FaSyncAlt /> Study Modes</button>
                <button className="footer-button"><FaEdit /> Edit Card</button>
                <button className="footer-button">View as Mind Map</button>
            </div>
        </div>
    );
};

export default FlashcardsView;