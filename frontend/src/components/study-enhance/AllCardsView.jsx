import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaTag } from 'react-icons/fa';
import './studyEnhance.css';

// Re-using the mock data from FlashcardsView for consistency
const mockFlashcards = [
    { id: 1, question: "What is the capital of France?", answer: "Paris", tags: ["Geography", "Europe"], status: "mastered" },
    { id: 2, question: "Define 'Photosynthesis'.", answer: "The process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.", tags: ["Biology"], status: "not-studied" },
    { id: 3, question: "Formula for water?", answer: "H₂O", tags: ["Chemistry", "Basic"], status: "forgot" },
    { id: 4, question: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare", tags: ["Literature", "History"], status: "mastered" },
    { id: 5, question: "What is the largest ocean on Earth?", answer: "Pacific Ocean", tags: ["Geography"], status: "not-studied" },
    { id: 6, question: "What is the powerhouse of the cell?", answer: "Mitochondria", tags: ["Biology"], status: "mastered" },
    { id: 7, question: "What is the chemical symbol for gold?", answer: "Au", tags: ["Chemistry"], status: "forgot" },
];

const AllCardsView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cards, setCards] = useState(mockFlashcards); // Manage cards in state for actions

    const filteredCards = cards.filter(card =>
        card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleEditCard = (cardId) => {
        alert(`Edit card with ID: ${cardId}`);
        // In a real app, this would navigate to an edit form or open a modal
    };

    const handleDeleteCard = (cardId) => {
        if (window.confirm(`Are you sure you want to delete card ${cardId}?`)) {
            setCards(prevCards => prevCards.filter(card => card.id !== cardId));
        }
    };

    const handleAddCard = () => {
        alert("Add New Card functionality (e.g., open a modal/form)");
        // In a real app, you'd open a form to add a new card
    };

    return (
        <div className="all-cards-view-container">
            <div className="all-cards-header">
                <h2>All Cards in "Biology Chapter 5"</h2>
                <div className="search-add-section">
                    <input
                        type="text"
                        placeholder="Search all cards..."
                        className="search-bar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="add-card-button" onClick={handleAddCard}>
                        <FaPlus /> Add New Card
                    </button>
                </div>
            </div>

            <div className="cards-grid">
                {filteredCards.map(card => (
                    <div key={card.id} className="card-item">
                        <div className="card-status">
                            {card.status === "mastered" && <FaCheckCircle className="mastered" />}
                            {card.status === "forgot" && <FaTimesCircle className="forgot" />}
                            {/* No icon for "not-studied" to keep it clean */}
                        </div>
                        <p className="card-item-question">{card.question}</p>
                        <p className="card-item-answer">{card.answer}</p>
                        <div className="card-item-tags">
                            {card.tags.map((tag, index) => (
                                <span key={index} className="card-item-tag">
                                    <FaTag style={{marginRight: '5px', fontSize: '0.7em'}}/>{tag}
                                </span>
                            ))}
                        </div>
                        <div className="card-item-actions">
                            <button className="card-item-action-button" onClick={() => handleEditCard(card.id)}>
                                <FaEdit />
                            </button>
                            <button className="card-item-action-button" onClick={() => handleDeleteCard(card.id)}>
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

             <div className="flashcards-footer"> {/* Re-using footer styles */}
                <button className="footer-button"><FaSyncAlt /> Study Modes</button>
                <button className="footer-button">View as Mind Map</button>
            </div>
        </div>
    );
};

export default AllCardsView;