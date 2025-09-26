const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer"); // For handling file uploads
const fs = require("fs"); // For file system operations (deleting temp files)

// Load environment variables
require("dotenv").config();

// Access your API key as an environment variable (recommended for security)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" }); // Files will be temporarily stored in the 'uploads/' directory

router.post("/generate-flashcards", upload.single("file"), async (req, res) => {
  try {
    const { textInput, granularity, focusArea } = req.body;
    let inputText = "";

    if (req.file) {
      const filePath = req.file.path;
      inputText = fs.readFileSync(filePath, "utf8");
      fs.unlinkSync(filePath);
    } else if (textInput) {
      inputText = textInput;
    } else {
      return res.status(400).json({ error: "No file uploaded or text provided." });
    }

    if (inputText.length === 0) {
      return res.status(400).json({ error: "Input text is empty." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
You are an AI assistant specialized in generating concise study materials.
Your task is to analyze the provided text and create a structured JSON output.

Instructions:
- The output MUST be a single, valid JSON object. Do not include any text, explanations, or markdown formatting outside of this JSON object.
- The root object must contain two keys: "suggestedTitle" (a string) and "flashcards" (an array of flashcard objects).
- The "suggestedTitle" should be a short, descriptive name for the deck based on the main subject of the text (e.g., "Principles of Photosynthesis", "Key Events of World War II").
- Each object in the "flashcards" array must have 'id' (a unique number), 'question' (a string), 'answer' (a string), and 'tags' (an array of strings).
- Create "atomic" flashcards, each testing a single, core concept.
- Generate relevant, concise tags for each card to categorize the information (e.g., "Definition", "Formula", "Historical Figure").

Parameters:
- Granularity: ${granularity || "medium"}
- Focus Area: ${focusArea || "None specified"}

Text to analyze:
"${inputText}"

Output JSON format example:
{
    "suggestedTitle": "Introduction to Computer Science",
    "flashcards": [
        { "id": 1, "question": "What is an algorithm?", "answer": "A set of rules to be followed in calculations or other problem-solving operations.", "tags": ["Algorithms", "Core Concepts"] }
    ]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini Raw Response:", text);

    let generatedData = {};
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        generatedData = JSON.parse(jsonMatch[1]);
      } else {
        generatedData = JSON.parse(text);
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      return res.status(500).json({
        error: "Failed to parse AI response. It might not be valid JSON.",
        rawResponse: text,
      });
    }

    if (!generatedData.suggestedTitle || !Array.isArray(generatedData.flashcards)) {
      return res.status(500).json({ error: "AI response did not match the required format { suggestedTitle, flashcards }." });
    }

    generatedData.flashcards = generatedData.flashcards.map((card) => ({
      id: card.id,
      question: card.question,
      answer: card.answer,
      tags: card.tags || [],
    }));

    res.json(generatedData);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({
      error: "Failed to generate flashcards. Please try again.",
      details: error.message,
    });
  }
});

// --- MIND MAP GENERATION ROUTE ---
router.post("/generate-mindmap", upload.single("file"), async (req, res) => {
    try {
        const { textInput, granularity, focusArea } = req.body;
        let inputText = "";

        if (req.file) {
            const filePath = req.file.path;
            inputText = fs.readFileSync(filePath, "utf8");
            fs.unlinkSync(filePath);
        } else if (textInput) {
            inputText = textInput;
        } else {
            return res.status(400).json({ error: "No file uploaded or text provided." });
        }

        if (inputText.length === 0) {
            return res.status(400).json({ error: "Input text is empty." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); // Using a faster model can be good for this

        // ✅ MODIFIED PROMPT: Now asks for a suggestedTitle
        const prompt = `
        You are an AI expert in knowledge synthesis and visualization. Your task is to transform the provided text into a hierarchical mind map structure.

        Instructions:
        1.  Analyze the text to identify the central theme, main topics, and supporting sub-topics.
        2.  The output must be a single, valid JSON object. Do not include any text or explanations outside of the JSON.
        3.  The root object must have two keys: "suggestedTitle" and "root".
        4.  The "suggestedTitle" should be a short, descriptive name for the mind map based on the main subject of the text (e.g., "The Solar System", "Key Concepts of Stoichiometry").
        5.  The 'root' node should represent the core subject, which can be the same as the title.
        6.  Each node in the tree must be an object with two keys: "name" (a string) and "children" (an array of other nodes).
        7.  If a topic has no sub-topics, its "children" array must be empty ([]).

        Parameters:
        - Granularity: ${granularity || "medium"}
        - Focus Area: ${focusArea ? `Prioritize concepts related to: ${focusArea}` : "None specified"}

        Text to analyze:
        "${inputText}"

        Output JSON format example:
        {
            "suggestedTitle": "The Process of Photosynthesis",
            "root": {
                "name": "Photosynthesis",
                "children": [
                    {
                        "name": "Inputs",
                        "children": [
                            { "name": "Sunlight", "children": [] }
                        ]
                    }
                ]
            }
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response for Mind Map:", text);

        let generatedData = {};
        try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                generatedData = JSON.parse(jsonMatch[1]);
            } else {
                generatedData = JSON.parse(text);
            }
        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON for mind map:", parseError);
            return res.status(500).json({ error: "Failed to parse AI response for the mind map.", rawResponse: text });
        }

        // ✅ MODIFIED VALIDATION: Check for both suggestedTitle and root
        if (!generatedData.root || !generatedData.suggestedTitle) {
             return res.status(500).json({
                error: "The AI response is missing the required 'suggestedTitle' or 'root' key.",
                rawResponse: text,
            });
        }

        // The response format is now { suggestedTitle: "...", root: {...} }
        res.json(generatedData);

    } catch (error) {
        console.error("Error generating mind map:", error);
        res.status(500).json({ error: "Failed to generate mind map.", details: error.message });
    }
});

module.exports = router;
