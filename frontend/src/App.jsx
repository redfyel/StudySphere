// App.js

import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./RootLayout";

// Core pages
import Home from "./components/home/Home";
import MoodTracker from "./components/mood-tracker/MoodTracker";

// Study Enhance
import AIGenerationScreen from "./components/study-enhance/AIGenerationScreen";
import FlashcardsLayout from "./components/study-enhance/flashcards/FlashcardsLayout";
import FlashcardsView from "./components/study-enhance/flashcards/FlashCardsView"; // Assuming this is the study session component
import AllCardsView from "./components/study-enhance/flashcards/AllCardsView";
import MindMapView from "./components/study-enhance/mindmaps/MindMapView";

// Rooms
import RoomList from "./components/room/RoomList";
import VideoCall from "./components/room/VideoCall";

// Resource Hub
import AllResources from "./components/all-resources/AllResources";
import PdfReader from "./components/pdf-reader/PdfReader";
import UploadPage from "./components/upload-page/UploadPage";
import MyLibrary from "./components/myLibrary/MyLibrary";
import GroupResources from "./components/group-resources/GroupResources";
import TrendingPage from "./components/trending-page/TrendingPage";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        // 🏠 Landing Page
        { index: true, element: <Home /> },

        // 📊 Mood Tracker
        { path: "mood-tracker", element: <MoodTracker /> },

        // 🎓 Study Enhance (Corrected and Restructured)
        {
          path: "study-enhance",
          children: [
            { index: true, element: <AIGenerationScreen /> },
            { path: "generate", element: <AIGenerationScreen /> },
            // FIX #1: Path corrected from "mindmap" to "mindmaps" to match sidebar link
            { path: "mindmaps", element: <MindMapView /> },

            // --- Layout Route Group ---
            // FIX #2: This pathless route renders FlashcardsLayout and then renders
            // one of its children in the <Outlet /> based on the URL.
            // This is the main fix for your error.
            {
              element: <FlashcardsLayout />,
              children: [
                { path: "flashcards", element: <FlashcardsView /> },
                { path: "flashcards/session", element: <FlashcardsView /> },
                { path: "flashcards/review", element: <FlashcardsView /> },
                { path: "decks", element: <AllCardsView /> },
                { path: "flashcards/shared", element: <AllCardsView /> },
                // You can add real components for these later
                { path: "stats", element: <h2>Statistics Page</h2> },
                { path: "settings", element: <h2>Settings Page</h2> },
              ],
            },

            {
              element : <MindMapView/>,
              children : [
                {path : "mindmaps/session", element : <MindMapView/>},
                {path : "mindmaps/shared", element : <MindMapView/>},
                {path : "generate", element : <AIGenerationScreen/>},
                {path : "mindmaps/review", element : <MindMapView/>},
                {path : "mind-maps", element : <MindMapView/>},

              ]
            }
          ],
        },

        // 🗣️ Rooms
        {
          path: "rooms",
          children: [
            { index: true, element: <RoomList /> },
            { path: "/rooms/:roomId", element: <VideoCall /> },
          ],
        },

        // 📚 Resource Hub
        {
          path: "resources",
          children: [
            { index: true, element: <AllResources /> },
            { path: "upload", element: <UploadPage /> },
            { path: "library", element: <MyLibrary /> },
            { path: "groups", element: <GroupResources /> },
            { path: "trending", element: <TrendingPage /> },
            { path: "pdf/:id", element: <PdfReader /> },
          ],
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;