import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import MoodTracker from "./components/mood-tracker/MoodTracker";
import RootLayout from "./RootLayout";
import AIGenerationScreen from "./components/study-enhance/AIGenerationScreen";
import FlashcardsView from "./components/study-enhance/FlashCardsView";
import MindMapView from "./components/study-enhance/MindMapView";
import Sidebar from "./components/sidebar/Sidebar";
import FlashcardsLayout from "./components/study-enhance/FlashcardsLayout";
import RoomList from './components/room/RoomList';
import VideoCall from './components/room/VideoCall';
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { path: "/mood-tracker", element: <MoodTracker /> },
        {
          path: "/study-enhance",
          children: [
            { index: true, element: <AIGenerationScreen /> },
            { path: "flashcards", element: <FlashcardsLayout /> },
            { path: "mindmap", element: <MindMapView /> }
          ],
        },
        {
          path: "/rooms",
          element: <div style={{ padding: "2em", fontSize: "1.5em", color: "var(--color-text-light)" }}><RoomList /></div>
        },
        {
          path: "/resource-hub",
          element: <div style={{ padding: "2em", fontSize: "1.5em", color: "var(--color-text-light)" }}>Resource Hub Coming Soon!</div>
        },
        {
          path:"/room/:roomId",
          element:<VideoCall />
        }
      ],
    },
  ]);
  return <RouterProvider router={router} />;
}

export default App;
