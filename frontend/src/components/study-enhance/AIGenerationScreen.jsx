// frontend/src/components/AIGenerationScreen.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUpload, FaFlask, FaRocket, FaTachometerAlt } from "react-icons/fa";
import { BsCollectionFill } from "react-icons/bs";
import { FaLayerGroup } from "react-icons/fa";
import Sidebar from "../sidebar/Sidebar";
import Dropdown from "../dropdown/Dropdown";
import ErrorMessage from "../errormessage/ErrorMessage"; 
import "./genscreen.css";

const AIGenerationScreen = () => {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [generateType, setGenerateType] = useState("flashcards");
  const [granularity, setGranularity] = useState("medium");
  const [focusArea, setFocusArea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigate = useNavigate();
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

   const detailLevelOptions = [
    { value: "high", label: "Main Concepts Only" },
    { value: "medium", label: "Key Details" },
    { value: "detailed", label: "In-Depth Questions" },
  ];

  const sidebarItems = [
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
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setTextInput("");
    }
  };

  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
    setFile(null);
  };

  const handleGranularitySelect = (selectedOption) => {
    setGranularity(selectedOption.value);
  };

  const handleGenerate = async () => {
     setError(null);
    if (!file && !textInput.trim()) {
      setError("Please upload a file or paste text to begin.");
      return;
    }
    setIsGenerating(true);

    const formData = new FormData();
    if (file) formData.append("file", file);
    else formData.append("textInput", textInput);
    formData.append("granularity", granularity);
    formData.append("focusArea", focusArea);
    formData.append("generateType", generateType);

    const aiEndpoint = `https://studysphere-n4up.onrender.com/api/ai/generate-${generateType}`;

    try {
      const aiResponse = await fetch(aiEndpoint, {
        method: "POST",
        body: formData,
      });
      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(
          errorData.error || `HTTP error! Status: ${aiResponse.status}`
        );
      }
      const generatedData = await aiResponse.json();

      if (generateType === "flashcards") {
        if (
          !generatedData.flashcards ||
          generatedData.flashcards.length === 0
        ) {
          throw new Error("No flashcards could be generated from the content.");
        }

        const deckTitle = prompt(
          "Your flashcards are ready! Please name your new deck:",
          generatedData.suggestedTitle
        );

        if (!deckTitle) {
          setIsGenerating(false);
          navigate("/study-enhance/flashcards", {
            state: { generatedFlashcards: generatedData.flashcards },
          });
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) throw new Error("You must be logged in to save a deck.");

        const config = {
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
        };
        const body = { title: deckTitle, flashcards: generatedData.flashcards };

        await axios.post(
          "https://studysphere-n4up.onrender.com/api/flashcards/decks",
          body,
          config
        );

        navigate("/study-enhance/flashcards", {
          state: { generatedFlashcards: generatedData.flashcards },
        });
      } else if (generateType === "mindmap") {
        // Validation now checks for the new structure
        if (!generatedData || !generatedData.root || !generatedData.suggestedTitle) {
          throw new Error("The AI response for the mind map was incomplete.");
        }
        
        // 1. Get the title directly from the AI response. NO MORE PROMPT!
        const mapTitle = generatedData.suggestedTitle;
        
        // 2. Prepare data for saving
        const token = localStorage.getItem("token");
        const config = { headers: { "Content-Type": "application/json", "x-auth-token": token } };
        // The body now contains the title and the mind map data object { root: ... }
        const body = { title: mapTitle, mindMapData: generatedData };

        // 3. Save the mind map to the database
        const savedMapResponse = await axios.post("https://studysphere-n4up.onrender.com/api/mindmaps/", body, config);
        const savedMap = savedMapResponse.data;

        // 4. Navigate to the viewer with the saved data
        navigate("/study-enhance/mindmaps/view", {
          state: { mindMapData: savedMap },
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || err.message;
      setError({
        message: "Generation Failed.",
        details: errorMessage || "An unexpected error occurred."
      });
    } finally {
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
          <div className="aigen-content-panel">
            <div className="aigen-header">
              <h1>Provide Your Content</h1>
              <p>Paste notes, upload a document, or start from scratch.</p>
            </div>
            <div className="aigen-input-area">
              <textarea
                placeholder="Paste your notes here..."
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
          <div className="aigen-control-panel">
            <div className="aigen-options">
              <h2 className="aigen-options-title">
                <FaFlask />
                Customize Your Tools
              </h2>
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
              <div className="option-row">
                <label>Level of Detail</label>
                <Dropdown
                  options={detailLevelOptions}
                  onSelect={handleGranularitySelect}
                  placeholder={
                    detailLevelOptions.find(opt => opt.value === granularity)?.label || "Select detail..."
                  }
                />
              </div>
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
            <div className="aigen-action-area">
              {/* ✅ 2. REPLACE THE OLD <p> TAG WITH THE NEW COMPONENT */}
              {error && (
                <ErrorMessage
                  title="Generation Failed"
                  message={error.message}
                  details={error.details}
                />
              )}
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