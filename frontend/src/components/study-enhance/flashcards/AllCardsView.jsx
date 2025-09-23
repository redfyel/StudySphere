import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaTag, FaSyncAlt } from 'react-icons/fa';
import '../studyEnhance.css';
// --- AllCardsView Component ---
const AllCardsView = () => {
    const location = useLocation();
    const { generatedFlashcards } = location.state || {};

    const [cards, setCards] = useState(generatedFlashcards || []);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
      if (generatedFlashcards && generatedFlashcards.length > 0) {
        setCards(generatedFlashcards.map(card => ({
            ...card,
            status: "not-studied" // Initialize status for all newly generated cards
        })));
      }
    }, [generatedFlashcards]);


    const filteredCards = cards.filter(card =>
        (card.question && card.question.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (card.answer && card.answer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (card.tags && card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const handleEditCard = (cardId) => {
        alert(`Edit card with ID: ${cardId}`);
        setCards(prevCards => prevCards.map(card =>
            card.id === cardId ? { ...card, question: card.question + ' (edited)' } : card
        ));
    };

    const handleDeleteCard = (cardId) => {
        if (window.confirm(`Are you sure you want to delete card ${cardId}?`)) {
            setCards(prevCards => prevCards.filter(card => card.id !== cardId));
        }
    };

    const handleAddCard = () => {
        alert("Add New Card functionality (e.g., open a modal/form)");
        const newId = Math.max(...cards.map(c => c.id), 0) + 1;
        const newCard = {
            id: newId,
            question: `New Question ${newId}`,
            answer: `New Answer ${newId}`,
            tags: ["New", "Custom"],
            status: "not-studied"
        };
        setCards(prevCards => [...prevCards, newCard]);
    };

    if (cards.length === 0) {
      return (
        <div className="all-flashcards-container no-cards-message">
          <h2 className="all-flashcards-header-title">No Flashcards to Display</h2>
          <p>Go to the <a href="/study-enhance">AI Generation Screen</a> to create some!</p>
        </div>
      );
    }

    return (
        <div className="all-flashcards-container">
            <div className="all-flashcards-header-area">
                <h2 className="all-flashcards-header-title">All Generated Cards</h2>
                <div className="all-flashcards-controls">
                    <input
                        type="text"
                        placeholder="Search all cards..."
                        className="all-flashcards-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="all-flashcards-add-button" onClick={handleAddCard}>
                        <FaPlus /> Add New Card
                    </button>
                </div>
            </div>

            <div className="all-flashcards-grid">
                {filteredCards.map(card => (
                    <div key={card.id} className="flashcard-preview-item">
                        <div className="flashcard-status-icon">
                            {card.status === "mastered" && <FaCheckCircle className="mastered" title="Mastered" />}
                            {card.status === "forgot" && <FaTimesCircle className="forgot" title="Forgot" />}
                        </div>
                        <p className="flashcard-preview-question">{card.question}</p>
                        <p className="flashcard-preview-answer">{card.answer}</p>
                        <div className="flashcard-preview-tags">
                            {card.tags && card.tags.map((tag, index) => (
                                <span key={index} className="flashcard-preview-tag">
                                    <FaTag style={{marginRight: '5px', fontSize: '0.7em'}}/>{tag}
                                </span>
                            ))}
                        </div>
                        <div className="flashcard-preview-actions">
                            <button className="flashcard-preview-action-button" onClick={() => handleEditCard(card.id)}>
                                <FaEdit />
                            </button>
                            <button className="flashcard-preview-action-button" onClick={() => handleDeleteCard(card.id)}>
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

             <div className="flashcard-navigation-footer"> {/* Reusing this footer class for consistency */}
                <button className="flashcard-footer-button"><FaSyncAlt /> Study Modes (Future Feature)</button>
                <button className="flashcard-footer-button">View as Mind Map (Future Feature)</button>
            </div>
        </div>
    );
};

export default AllCardsView;