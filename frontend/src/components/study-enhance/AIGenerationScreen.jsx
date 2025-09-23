import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUpload,
  FaFileAlt,
  FaFlask,
  FaRocket,
  FaLightbulb,
  FaSearch,
  FaSyncAlt,
  FaArrowLeft,
  FaArrowRight,
  FaEdit,
  FaFire,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaTag,
} from "react-icons/fa";
import "./genscreen.css";
import { BsCollectionFill } from "react-icons/bs";
import { FaLayerGroup, FaTachometerAlt } from "react-icons/fa";

import Sidebar from "../sidebar/Sidebar";

// --- AIGenerationScreen Component ---
const AIGenerationScreen = () => {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [generateType, setGenerateType] = useState("flashcards"); // Default to flashcards for this feature
  const [granularity, setGranularity] = useState("medium");
  const [focusArea, setFocusArea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(""); // To display API errors

  // lines needed for sidebar -- import at top and add to return
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  // The new, simplified, and more intuitive sidebar structure
  const sidebarItems = [
    {
      // A "home base" for the user. Combines "Study" and "Analytics".
      name: "Dashboard",
      path: "/study-enhance/dashboard", // A new central dashboard route
      icon: <FaTachometerAlt />, // A dashboard icon
    },
    {
      section: "Library",
      items: [
        {
          name: "Flashcard Decks",
          path: "/study-enhance/decks",
          icon: <BsCollectionFill />,
        },
        {
          name: "Mind Maps",
          path: "/study-enhance/mindmaps",
          icon: <FaLayerGroup />,
        },
      ],
    },
    {
      section: "Create New",
      items: [
        {
          name: "Generate with AI",
          path: ["/study-enhance/generate", "/study-enhance"],
          icon: <FaRocket />,
        },
      ],
    },
  ];

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setTextInput(""); // Clear text input if a file is selected
    }
  };

  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
    setFile(null); // Clear file if text is being entered
  };

  const handleGenerate = async () => {
    setError(""); // Clear previous errors
    if (!file && !textInput.trim()) {
      setError(
        "Please upload a file or paste some text to generate study tools."
      );
      return;
    }

    setIsGenerating(true);

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    } else {
      formData.append("textInput", textInput);
    }
    formData.append("granularity", granularity);
    formData.append("focusArea", focusArea);
    formData.append("generateType", generateType);

    // Step 1: Determine the correct API endpoint based on the selected tool type
    const endpoint =
      generateType === "flashcards"
        ? "http://localhost:5000/api/ai/generate-flashcards"
        : "http://localhost:5000/api/ai/generate-mindmap"; // The new endpoint for mind maps

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData, // FormData automatically sets Content-Type
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const generatedData = await response.json();
      setIsGenerating(false);

      // Step 2: Handle the response and navigate to the correct page
      if (generateType === "flashcards") {
        if (generatedData && generatedData.length > 0) {
          console.log("Generated Flashcards:", generatedData);
          // Navigate to the flashcards view with the generated data
          navigate("/study-enhance/flashcards", {
            state: { generatedFlashcards: generatedData },
          });
        } else {
          setError(
            "No flashcards could be generated from the provided content."
          );
        }
      } else if (generateType === "mindmap") {
        // We'll assume a valid mind map has a 'root' node. Adjust if your data structure is different.
        if (generatedData && generatedData.root) {
          console.log("Generated Mind Map:", generatedData);
          // Navigate to a new mind map view page with the generated data
          navigate("/study-enhance/mindmaps", {
            state: { mindMapData: generatedData },
          });
        } else {
          setError("No mind map could be generated from the provided content.");
        }
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err.message || "An unexpected error occurred during generation."
      );
      setIsGenerating(false);
    }
  };

  return (
    <div className="sidebar-page-layout">
      <Sidebar
        sectionName="Smart Learn"
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        items={sidebarItems}
      />
      <div className={`sidebar-page-content ${isCollapsed ? "collapsed" : ""}`}>
        <div className="aigen-container">
          {/* Left Column: Content Input */}
          <div className="aigen-content-panel">
            <div className="aigen-header">
              <h1>Provide Your Content</h1>
              <p>Paste your notes, upload a document, or start from scratch.</p>
            </div>
            <div className="aigen-input-area">
              <textarea
                placeholder="Paste your notes, a chapter, or any text here..."
                value={textInput}
                onChange={handleTextInputChange}
                className="aigen-textarea"
              ></textarea>
              <div className="aigen-file-dropzone">
                <FaUpload />
                <p>
                  <strong>Or upload a file</strong>
                  <span>{file ? file.name : "PDF, DOCX, or TXT"}</span>
                </p>
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Control Panel */}
          <div className="aigen-control-panel">
            <div className="aigen-options">
              <h2 className="aigen-options-title">
                <FaFlask />
                Customize Your Tools
              </h2>

              {/* Tool Type */}
              <div className="option-row">
                <label htmlFor="tool-type">Tool Type</label>
                <div className="segmented-control">
                  <button
                    className={`segment-button ${
                      generateType === "flashcards" ? "active" : ""
                    }`}
                    onClick={() => setGenerateType("flashcards")}
                  >
                    Flashcards
                  </button>
                  <button
                    className={`segment-button ${
                      generateType === "mindmap" ? "active" : ""
                    }`}
                    onClick={() => setGenerateType("mindmap")}
                  >
                    Mind Map
                  </button>
                </div>
              </div>

              {/* Level of Detail */}
              <div className="option-row">
                <label htmlFor="granularity-select">Level of Detail</label>
                <select
                  id="granularity-select"
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value)}
                  className="aigen-select"
                >
                  <option value="high">Main Concepts Only</option>
                  <option value="medium">Key Details</option>
                  <option value="detailed">In-Depth Questions</option>
                </select>
              </div>

              {/* Focus Area */}
              <div className="option-row">
                <label htmlFor="focus-input">Focus Area (Optional)</label>
                <input
                  type="text"
                  id="focus-input"
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  placeholder="e.g., 'key dates, formulas'"
                  className="aigen-input"
                />
              </div>
            </div>

            {/* Action Area */}
            <div className="aigen-action-area">
              {error && <p className="aigen-error-message">{error}</p>}
              <button
                className="aigen-generate-button"
                onClick={handleGenerate}
                disabled={isGenerating || (!file && !textInput.trim())}
              >
                {isGenerating ? (
                  <>
                    <FaRocket className="spinner-icon" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FaRocket />
                    Generate Study Tools
                  </>
                )}
              </button>
              {isGenerating && (
                <p className="aigen-loading-message">
                  The AI is working its magic!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerationScreen;
