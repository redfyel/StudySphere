import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./components/home/Home";
import MoodTracker from "./components/mood-tracker/MoodTracker";
import RootLayout from "./RootLayout";
import AIGenerationScreen from "./components/study-enhance/AIGenerationScreen";
import FlashcardsLayout from "./components/study-enhance/FlashcardsLayout";
import MindMapView from "./components/study-enhance/MindMapView";
import RoomList from "./components/room/RoomList";
import VideoCall from "./components/room/VideoCall";

// Resource Hub components
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
        // Landing page
        { index: true, element: <Home /> },

        // Mood Tracker
        { path: "mood-tracker", element: <MoodTracker /> },

        // Study Enhance section
        {
          path: "study-enhance",
          children: [
            { index: true, element: <AIGenerationScreen /> },
            { path: "flashcards", element: <FlashcardsLayout /> },
            { path: "mindmap", element: <MindMapView /> },
          ],
        },

        // Rooms
        { path: "rooms", element: <RoomList /> },
        { path: "room/:roomId", element: <VideoCall /> },

        // Resource Hub
        { path: "resources", element: <AllResources /> },
        { path: "resources/pdf/:id", element: <PdfReader /> },
        { path: "upload", element: <UploadPage /> },
        { path: "my-library", element: <MyLibrary /> },
        { path: "groups", element: <GroupResources /> },
        { path: "trending", element: <TrendingPage /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
