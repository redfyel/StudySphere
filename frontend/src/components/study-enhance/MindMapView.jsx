import React, { useState } from 'react';
import { FaPlusCircle, FaMinusCircle, FaLightbulb } from 'react-icons/fa';
import './studyEnhance.css'; // Import the CSS file

const mockMindMapData = {
    id: 'root',
    label: 'Intro to Psychology',
    children: [
        {
            id: 'history',
            label: 'History of Psychology',
            description: 'Exploration of early philosophical roots and key figures like Wundt, James.',
            children: [
                { id: 'structuralism', label: 'Structuralism', description: 'Wundt: breaking down mental processes.' },
                { id: 'functionalism', label: 'Functionalism', description: 'James: purpose of consciousness.' }
            ]
        },
        {
            id: 'perspectives',
            label: 'Major Perspectives',
            description: 'Different schools of thought in psychology.',
            children: [
                { id: 'behaviorism', label: 'Behaviorism', description: 'Watson, Skinner: observable behavior.' },
                { id: 'cognitive', label: 'Cognitive Psychology', description: 'Information processing, memory, problem-solving.' }
            ]
        },
        {
            id: 'research',
            label: 'Research Methods',
            description: 'How psychologists collect and analyze data.',
            children: []
        }
    ]
};

const MindMapNode = ({ node, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className={`mind-map-node level-${level}`}>
            <div className="node-header" onClick={() => setShowDetails(!showDetails)}>
                <span className="node-label">{node.label}</span>
                {node.children && node.children.length > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="expand-toggle">
                        {isExpanded ? <FaMinusCircle /> : <FaPlusCircle />}
                    </button>
                )}
            </div>

            {showDetails && node.description && (
                <div className="node-details">
                    <p>{node.description}</p>
                    <button className="generate-flashcards-button">
                        <FaLightbulb /> Generate Flashcards for "{node.label}"
                    </button>
                </div>
            )}

            {isExpanded && node.children && node.children.length > 0 && (
                <div className="node-children">
                    {node.children.map(child => (
                        <MindMapNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};


const MindMapView = () => {
    return (
        <div className="mind-map-view">
            <h2>Mind Map for 'Intro to Psychology'</h2>
            <div className="mind-map-container">
                <MindMapNode node={mockMindMapData} />
            </div>
            <div className="mind-map-footer">
                <button className="footer-button">Zoom In</button>
                <button className="footer-button">Zoom Out</button>
                <button className="footer-button">View Flashcards</button>
            </div>
        </div>
    );
};

export default MindMapView;