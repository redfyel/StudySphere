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
      // Read content from the uploaded file
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, "utf8");
      inputText = fileContent;

      // Clean up the temporary file
      fs.unlinkSync(filePath);
      console.log(`Deleted temporary file: ${filePath}`);
    } else if (textInput) {
      inputText = textInput;
    } else {
      return res
        .status(400)
        .json({ error: "No file uploaded or text provided." });
    }

    if (inputText.length === 0) {
      return res
        .status(400)
        .json({ error: "Input text is empty. Please provide content." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Construct a more detailed prompt for flashcard generation
    const prompt = `
You are an AI assistant specialized in generating concise study flashcards.
Given the following text and parameters, create a list of flashcards.

Instructions:
- The goal is to create "atomic" flashcards, each testing a single, core concept.
- Each flashcard must have a 'question' and an 'answer'.
- Questions should be direct and simple, phrased to test recall (e.g., "What is X?", "Define Y.", "Who invented Z?").
- Answers should be short and to the point, containing only the key information.
- The output must be a JSON array of flashcard objects. Each object should have 'id', 'question', 'answer', and an optional 'tags' array.
- Assign unique IDs to each flashcard, starting from 1.
- If no relevant flashcards can be generated, return an empty array.

Parameters:
- Granularity: ${
      granularity || "medium"
    } (e.g., 'high' for main concepts only, 'medium' for key details, 'detailed' for specific facts)
- Focus Area: ${
      focusArea ? focusArea : "None specified"
    } (prioritize questions related to these keywords)

Text to analyze:
"${inputText}"

Output JSON format example:
[
    { "id": 1, "question": "What is X?", "answer": "X is Y.", "tags": ["Concept", "Definition"] },
    { "id": 2, "question": "Who invented Z?", "answer": "Z was invented by John Doe.", "tags": ["History"] }
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini Raw Response:", text);

    // Attempt to parse the JSON string from Gemini's response
    let flashcards = [];
    try {
      // Gemini might wrap JSON in markdown, so extract it
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        flashcards = JSON.parse(jsonMatch[1]);
      } else {
        // If not markdown-wrapped, try direct parse
        flashcards = JSON.parse(text);
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Problematic text:", text);
      // Fallback for unparseable responses
      return res
        .status(500)
        .json({
          error: "Failed to parse AI response. It might not be valid JSON.",
          rawResponse: text,
        });
    }

    // Add a simple fallback for empty tags array if Gemini doesn't always provide it
    flashcards = flashcards.map((card) => ({
      id: card.id,
      question: card.question,
      answer: card.answer,
      tags: card.tags || [], // Ensure tags is an array
    }));

    res.json(flashcards);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    if (error.response && error.response.data) {
      console.error("Gemini API Error details:", error.response.data);
    }
    res
      .status(500)
      .json({
        error: "Failed to generate flashcards. Please try again.",
        details: error.message,
      });
  }
});

// --- NEW MIND MAP GENERATION ROUTE ---
router.post("/generate-mindmap", upload.single("file"), async (req, res) => {
    try {
        const { textInput, granularity, focusArea } = req.body;
        let inputText = "";

        // Re-usable logic to get input text from file or direct input
        if (req.file) {
            const filePath = req.file.path;
            const fileContent = fs.readFileSync(filePath, "utf8");
            inputText = fileContent;
            fs.unlinkSync(filePath); // Clean up the temporary file
            console.log(`Processed and deleted temporary file: ${filePath}`);
        } else if (textInput) {
            inputText = textInput;
        } else {
            return res.status(400).json({ error: "No file uploaded or text provided." });
        }

        if (inputText.length === 0) {
            return res.status(400).json({ error: "Input text is empty. Please provide content." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        // This prompt is the secret sauce. It's engineered to request a hierarchical JSON.
        const prompt = `
        You are an AI expert in knowledge synthesis and visualization. Your task is to transform the provided text into a hierarchical mind map structure.

        Instructions:
        1.  Analyze the text to identify the central theme, main topics, and supporting sub-topics.
        2.  The output must be a single, valid JSON object. Do not include any text or explanations outside of the JSON.
        3.  The structure must be a tree, starting with a single 'root' node representing the core subject.
        4.  Each node in the tree must be an object with two keys: "name" (a string) and "children" (an array of other nodes).
        5.  The "name" should be a concise summary of the concept at that level.
        6.  If a topic has no sub-topics, its "children" array must be empty ([]).
        7.  The depth of the mind map should reflect the requested granularity.

        Parameters:
        - Granularity: ${granularity || "medium"}
            - 'high': Broad, top-level themes only. (2-3 levels deep)
            - 'medium': Key concepts and their primary relationships. (3-4 levels deep)
            - 'detailed': Specific facts, examples, and nuanced connections. (4+ levels deep)
        - Focus Area: ${focusArea ? `Prioritize concepts related to: ${focusArea}` : "None specified"}

        Text to analyze:
        "${inputText}"

        Output JSON format example:
        {
            "root": {
                "name": "Central Theme",
                "children": [
                    {
                        "name": "Main Topic 1",
                        "children": [
                            { "name": "Sub-Topic A", "children": [] },
                            { "name": "Sub-Topic B", "children": [] }
                        ]
                    },
                    {
                        "name": "Main Topic 2",
                        "children": []
                    }
                ]
            }
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response for Mind Map:", text);

        let mindMapData = {};
        try {
            // Use the same robust JSON parsing logic
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                mindMapData = JSON.parse(jsonMatch[1]);
            } else {
                // If not markdown-wrapped, try direct parse
                mindMapData = JSON.parse(text);
            }
        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON for mind map:", parseError);
            console.error("Problematic text:", text);
            return res.status(500).json({
                error: "Failed to parse AI response for the mind map. The format was invalid.",
                rawResponse: text,
            });
        }

        // Basic validation to ensure the AI followed instructions
        if (!mindMapData.root || !mindMapData.root.name) {
             return res.status(500).json({
                error: "The generated mind map is missing the 'root' node. The AI failed to follow the required format.",
                rawResponse: text,
            });
        }

        res.json(mindMapData);

    } catch (error) {
        console.error("Error generating mind map:", error);
        if (error.response && error.response.data) {
            console.error("Gemini API Error details:", error.response.data);
        }
        res.status(500).json({
            error: "Failed to generate mind map. Please try again.",
            details: error.message,
        });
    }
});

module.exports = router;
