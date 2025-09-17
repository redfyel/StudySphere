import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaFileAlt, FaBrain, FaFlask, FaPalette, FaRocket } from 'react-icons/fa'; // Added FaRocket for generate button
import './studyEnhance.css'; // Import the CSS file

// Mock data (for demonstration purposes, should come from AI in real app)
const mockFlashcards = [
    { id: 1, question: "What is the capital of France?", answer: "Paris", tags: ["Geography"] },
    { id: 2, question: "Define 'Photosynthesis'.", answer: "The process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.", tags: ["Biology"] },
    { id: 3, question: "Formula for water?", answer: "H₂O", tags: ["Chemistry"] },
    { id: 4, question: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare", tags: ["Literature"] },
];

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
    ]
};


const AIGenerationScreen = () => {
    const [file, setFile] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [generateType, setGenerateType] = useState('both'); // 'flashcards', 'mindmap', 'both'
    const [granularity, setGranularity] = useState('medium'); // 'high', 'medium', 'detailed'
    const [focusArea, setFocusArea] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleGenerate = async () => {
        if (!file && !textInput.trim()) {
            alert('Please upload a file or paste some text to generate study tools.');
            return;
        }

        setIsGenerating(true);
        console.log('Generating study tools with:', { file: file?.name, textInput: textInput.substring(0, 50) + '...', generateType, granularity, focusArea });

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        setIsGenerating(false);

        // For demonstration, navigate to the flashcards or mind map view
        // In a real app, you'd pass the AI-generated data
        if (generateType === 'flashcards') {
            navigate('/study-enhance/flashcards', { state: { generatedFlashcards: mockFlashcards } });
        } else if (generateType === 'mindmap') {
            navigate('/study-enhance/mindmap', { state: { generatedMindMap: mockMindMapData } });
        } else { // 'both' option
            // When both are generated, you might navigate to flashcards with a prompt to view mind map,
            // or to a dashboard view showing both. For simplicity, we'll go to flashcards for now.
            navigate('/study-enhance/flashcards', { state: { generatedFlashcards: mockFlashcards, generatedMindMap: mockMindMapData } });
        }
    };

    return (
        <div className="ai-generation-page-wrapper">
            <div className="ai-generation-screen">
                <h2>Transform Your Notes into Study Tools</h2>

                {/* Left Section: Input Area */}
                <div className="input-section">
                    <div className="file-upload-area" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files.length > 0) {
                            setFile(e.dataTransfer.files[0]);
                        }
                    }}>
                        <FaUpload size={40} className="upload-icon" />
                        <p>Drag & Drop your notes, textbook chapter, or</p>
                        <input type="file" id="file-upload" onChange={handleFileChange} accept=".pdf,.docx,.txt" style={{ display: 'none' }} />
                        <label htmlFor="file-upload" className="upload-button">Upload File</label>
                        {file && <p>Selected: **{file.name}**</p>}
                    </div>

                    <div className="or-divider">OR</div>

                    <textarea
                        placeholder="Paste text directly here..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows="8"
                    ></textarea>

                    <button className="connect-resources-button">
                        <FaFileAlt /> Select from My Notes / Group Resources
                    </button>
                </div>

                {/* Right Section: Options Sidebar */}
                <div className="options-sidebar">
                    <div className="tool-selection">
                        <h3>Select Tool(s) to Generate:</h3>
                        <div className="toggle-buttons">
                            <button
                                className={generateType === 'flashcards' ? 'active' : ''}
                                onClick={() => setGenerateType('flashcards')}
                            >
                                <FaFlask /> Flashcards
                            </button>
                            <button
                                className={generateType === 'mindmap' ? 'active' : ''}
                                onClick={() => setGenerateType('mindmap')}
                            >
                                <FaBrain /> Mind Map
                            </button>
                            <button
                                className={generateType === 'both' ? 'active' : ''}
                                onClick={() => setGenerateType('both')}
                            >
                                <FaPalette /> Both
                            </button>
                        </div>
                    </div>

                    <div className="advanced-options">
                        <h3>Advanced Options</h3>
                        <div className="option-group">
                            <label>Granularity:</label>
                            <select value={granularity} onChange={(e) => setGranularity(e.target.value)}>
                                <option value="high">High-Level Concepts</option>
                                <option value="medium">Medium Detail</option>
                                <option value="detailed">Detailed Breakdown</option>
                            </select>
                        </div>
                        <div className="option-group">
                            <label>Focus Area (Keywords/Phrases):</label>
                            <input
                                type="text"
                                value={focusArea}
                                onChange={(e) => setFocusArea(e.target.value)}
                                placeholder="e.g., 'Thermodynamics equations'"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Generate Button */}
                <div className="generate-container">
                    <button
                        className="generate-button"
                        onClick={handleGenerate}
                        disabled={isGenerating || (!file && !textInput.trim())}
                    >
                        {isGenerating ? (
                            <>
                                <FaRocket className="spinner" /> AI is crafting your study tools...
                            </>
                        ) : (
                            <>
                                <FaRocket /> Generate Study Tools
                            </>
                        )}
                    </button>
                    {isGenerating && <p className="loading-message">This might take a moment!</p>}
                </div>
            </div>
        </div>
    );
};

export default AIGenerationScreen;