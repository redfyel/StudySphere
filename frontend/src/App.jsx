import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./RootLayout";

// Core pages
import Home from "./components/home/Home";
import MoodTracker from "./components/mood-tracker/MoodTracker";

// Study Enhance
import AIGenerationScreen from "./components/study-enhance/AIGenerationScreen";
import FlashcardsLayout from "./components/study-enhance/FlashcardsLayout";
import MindMapView from "./components/study-enhance/MindMapView";

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

        // 🎓 Study Enhance
        {
          path: "study-enhance",
          children: [
            { index: true, element: <AIGenerationScreen /> },
            { path: "flashcards", element: <FlashcardsLayout /> },
            { path: "mindmap", element: <MindMapView /> },
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
            { index: true, element: <AllResources /> }, // /resources
            { path: "upload", element: <UploadPage /> }, // /resources/upload
            { path: "library", element: <MyLibrary /> }, // /resources/library
            { path: "groups", element: <GroupResources /> }, // /resources/groups
            { path: "trending", element: <TrendingPage /> }, // /resources/trending
            { path: "pdf/:id", element: <PdfReader /> }, // /resources/pdf/123
          ],
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
