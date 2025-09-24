// App.jsx

import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./RootLayout";

// Core pages
import Home from "./components/home/Home";
import MoodTracker from "./components/mood-tracker/MoodTracker";

// Study Enhance Components
import AIGenerationScreen from "./components/study-enhance/AIGenerationScreen";
import FlashcardsView from "./components/study-enhance/flashcards/FlashCardsView";
import AllDecksView from "./components/study-enhance/flashcards/AllDecksView"; // Corrected import name
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

// Tasks
import Tasks from "./components/tasks/Tasks";
import CalendarView from "./components/tasks/CalendarView";

// Auth
import Login from "./components/login/Login";
import Register from "./components/register/Register";
import StartStudyPage from "./components/study-enhance/flashcards/StartStudyPage";

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
        // THE FIX: The routes are now "flat". Each path directly renders its component
        // without being nested inside a layout component that was causing conflicts.
        {
          path: "study-enhance",
          children: [
            // Default and generation routes
            { index: true, element: <AIGenerationScreen /> },
            { path: "generate", element: <AIGenerationScreen /> },

            // All Mind Map related routes
            { path: "mindmaps", element: <MindMapView /> },
            { path: "mindmaps/session", element: <MindMapView /> },
            { path: "mindmaps/shared", element: <MindMapView /> },
            { path: "mindmaps/review", element: <MindMapView /> },
            { path: "mind-maps", element: <MindMapView /> },

            // All Flashcard related routes
            { path: "decks", element: <AllDecksView /> }, // This will now render correctly
            { path: "flashcards", element: <FlashcardsView /> },
            { path: "flashcards/session", element: <StartStudyPage/> },
            { path: "flashcards/review", element: <FlashcardsView /> },
            { path: "flashcards/shared", element: <FlashcardsView /> },

            // Other Study Enhance routes
            { path: "stats", element: <h2>Statistics Page</h2> },
            { path: "settings", element: <h2>Settings Page</h2> },
          ],
        },

        // 🗣️ Rooms
        {
          path: "rooms",
          children: [
            { index: true, element: <RoomList /> },
            { path: ":roomId", element: <VideoCall /> }, 
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
        
        // Other top-level routes
        { path: "tasksu", element: <Tasks /> }, // Note: consider renaming to "tasks-summary" or similar
        { path: "tasks", element: <CalendarView /> },
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },
        { path: "dashboard", element: <h2>Dashboard - Protected Route</h2> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;