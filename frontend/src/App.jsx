import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./components/home/Home";
import MoodTracker from "./components/mood-tracker/MoodTracker";
import RootLayout from "./RootLayout";
import AIGenerationScreen from "./components/study-enhance/AIGenerationScreen";
import MindMapView from "./components/study-enhance/MindMapView";
import FlashcardsLayout from "./components/study-enhance/FlashcardsLayout";
import MindMapView from "./components/study-enhance/MindMapView";
import RoomList from './components/room/RoomList';
import VideoCall from './components/room/VideoCall';

// Import your Resource Hub components
import AllResources from './components/all-resources/AllResources';
import PdfReader from './components/pdf-reader/PdfReader';
import UploadPage from './components/upload-page/UploadPage';
import MyLibrary from './components/myLibrary/MyLibrary';
import GroupResources from "./components/group-resources/GroupResources";
import TrendingPage from "./components/trending-page/TrendingPage";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,

      children: [
        { index: true, element: <Home /> },
        { path: "/mood-tracker", element: <MoodTracker /> },
        {
          path: "/study-enhance",
          children: [
            {
              index: true,
              element: <AIGenerationScreen />,
            },
            {
              path: "flashcards",
              element: <FlashcardsLayout />,
            },
            {
              path: "mindmap",
              element: <MindMapView />,
            },
          ],
        },
        {
          path: "/rooms",
          element: (
            <div
              style={{
                padding: "2em",
                fontSize: "1.5em",
                color: "var(--color-text-light)",
              }}
            >
              Rooms Coming Soon!
            </div>
          ),
        },
        {
          path: "/resource-hub",
          element: (
            <div
              style={{
                padding: "2em",
                fontSize: "1.5em",
                color: "var(--color-text-light)",
              }}
            >
              Resource Hub Coming Soon!
            </div>
          ),
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;