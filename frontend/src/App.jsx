// import "./App.css";
// import { createBrowserRouter, RouterProvider } from "react-router-dom";

// import MoodTracker from "./components/mood-tracker/MoodTracker";
// import RootLayout from "./RootLayout";
// import AIGenerationScreen from "./components/study-enhance/AIGenerationScreen";
// import FlashcardsView from "./components/study-enhance/FlashCardsView";
// import MindMapView from "./components/study-enhance/MindMapView";
// import Sidebar from "./components/sidebar/Sidebar";
// import FlashcardsLayout from "./components/study-enhance/FlashcardsLayout";
// import RoomList from './components/room/RoomList';
// import VideoCall from './components/room/VideoCall';
// function App() {
//   const router = createBrowserRouter([
//     {
//       path: "/",
//       element: <RootLayout />,
//       children: [
//         { path: "/mood-tracker", element: <MoodTracker /> },
//         {
//           path: "/study-enhance",
//           children: [
//             { index: true, element: <AIGenerationScreen /> },
//             { path: "flashcards", element: <FlashcardsLayout /> },
//             { path: "mindmap", element: <MindMapView /> }
//           ],
//         },
//         {
//           path: "/rooms",
//           element: <div style={{ padding: "2em", fontSize: "1.5em", color: "var(--color-text-light)" }}><RoomList /></div>
//         },
//         {
//           path: "/resource-hub",
//           element: <div style={{ padding: "2em", fontSize: "1.5em", color: "var(--color-text-light)" }}>Resource Hub Coming Soon!</div>
//         },
//         {
//           path:"/room/:roomId",
//           element:<VideoCall />
//         }
//       ],
//     },
//   ]);
//   return <RouterProvider router={router} />;
// }

// export default App;


import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MoodTracker from "./components/mood-tracker/MoodTracker";
import RootLayout from "./RootLayout";
import AIGenerationScreen from "./components/study-enhance/AIGenerationScreen";
import FlashcardsLayout from "./components/study-enhance/FlashcardsLayout";
import MindMapView from "./components/study-enhance/MindMapView";
import RoomList from './components/room/RoomList';
import VideoCall from './components/room/VideoCall';

// Import your Resource Hub components
import AllResources from './components/all-resources/AllResources';
import PdfReader from './components/pdf-reader/PdfReader';
const UploadPage = () => <div className="content"><h2>Upload Resource</h2></div>;
const MyLibraryPage = () => <div className="content"><h2>My Library</h2></div>;
const GroupsPage = () => <div className="content"><h2>Group Resources</h2></div>;
const TrendingPage = () => <div className="content"><h2>Trending Resources</h2></div>;

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
          path: "/room/:roomId",
          element: <VideoCall />
        },
        // All your Resource Hub routes
        
        { path: "/resources", element: <AllResources /> },
        { path: "/resources/pdf/:id", element: <PdfReader /> },
        { path: "/upload", element: <UploadPage /> },
        { path: "/my-library", element: <MyLibraryPage /> },
        { path: "/groups", element: <GroupsPage /> },
        { path: "/trending", element: <TrendingPage /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;