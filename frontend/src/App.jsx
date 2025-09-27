import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// --- CONTEXTS & LAYOUTS ---
// Use UserLoginStore (now the unified context provider)
// FIX: Assuming the context file is UserLoginContext.jsx
import { UserLoginStore } from "./contexts/UserLoginContext.jsx"; 

// FIX: Assuming RootLayout is RootLayout.jsx
import RootLayout from "./RootLayout.jsx";
// FIX: Assuming components are .jsx
import ProtectedRoute from "./components/room/ProtectedRoute.jsx";

// --- CORE PAGES ---
// FIX: Assuming components are .jsx
import Home from "./components/home/Home.jsx";
// FIX: Assuming components are .jsx
import WellnessPage from "./components/mood-tracker/Wellness.jsx"; 

// --- STUDY ENHANCE COMPONENTS ---
// FIX: Assuming components are .jsx
import AIGenerationScreen from "./components/study-enhance/AIGenerationScreen.jsx";
import FlashcardsView from "./components/study-enhance/flashcards/FlashCardsView.jsx";
import AllDecksView from "./components/study-enhance/flashcards/AllDecksView.jsx";
import MindMapView from "./components/study-enhance/mindmaps/MindMapView.jsx";
import ReviewMasteredView from "./components/study-enhance/flashcards/ReviewMasteredView.jsx";
import AllMindMapsView from "./components/study-enhance/mindmaps/AllMindMapsView.jsx";
import ReviewMapsView from "./components/study-enhance/mindmaps/ReviewMapsView.jsx";
import StartStudyMap from "./components/study-enhance/mindmaps/StartStudyMap.jsx";
import StartStudyPage from "./components/study-enhance/flashcards/StartStudyPage.jsx";

// --- ROOMS COMPONENTS ---
// FIX: Assuming components are .jsx
import RoomList from "./components/room/RoomList.jsx";
import VideoCall from "./components/room/VideoCall.jsx";
import AuthScreen from "./components/room/AuthScreen.jsx"; 
import WelcomePopUp from "./components/room/WelcomePopUp.jsx"; 
import RoomLobby from "./components/room/RoomLobby.jsx"; 

// --- RESOURCE HUB COMPONENTS ---
// FIX: Assuming components are .jsx
import AllResources from "./components/all-resources/AllResources.jsx";
import PdfReader from "./components/pdf-reader/PdfReader.jsx";
import UploadPage from "./components/upload-page/UploadPage.jsx";
import MyLibrary from "./components/myLibrary/MyLibrary.jsx";
import GroupResources from "./components/group-resources/GroupResources.jsx";

// --- TASKS COMPONENTS ---
// FIX: Assuming components are .jsx
import Tasks from "./components/tasks/Tasks.jsx";
import CalendarView from "./components/tasks/CalendarView.jsx";

// --- AUTH COMPONENTS ---
// FIX: Assuming components are .jsx
import Login from "./components/login/Login.jsx";
import Register from "./components/register/Register.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";

function App() {
const router = createBrowserRouter([
 {
 path: "/",
 element: <RootLayout />,
 children: [
  // 🏠 Landing Page
  { index: true, element: <Home /> },

    // 🔑 Global Authentication Screen
    { path: "auth", element: <AuthScreen /> }, 
    { path: "login", element: <Login /> },
  { path: "register", element: <Register /> },

  // 📊 Mood Tracker
  { path: "mood-tracker", element: <WellnessPage /> },

    // --- PROTECTED ROUTES START HERE ---
    {
      element: <ProtectedRoute />, 
      children: [
        
        { path: "dashboard", element: <Dashboard/> },
        { path: "welcome", element: <WelcomePopUp /> },

        // 🎓 Study Enhance
        {
          path: "study-enhance",
          children: [
            // Default and generation routes
            { index: true, element: <AIGenerationScreen /> },
            { path: "generate", element: <AIGenerationScreen /> },

      // All Mind Map related routes
      { path: "mindmaps", element: <AllMindMapsView /> },
      { path: "mindmaps/all", element: <AllMindMapsView /> },
      { path: "mindmaps/session", element: <StartStudyMap /> },
      { path: "mindmaps/shared", element: <MindMapView /> },
      { path: "mindmaps/review", element: <ReviewMapsView /> },
      { path: "mindmaps/view", element: <MindMapView /> },

            // Flashcard routes
            { path: "decks", element: <AllDecksView /> },
            { path: "flashcards", element: <FlashcardsView /> },
            { path: "flashcards/session", element: <StartStudyPage /> },
            { path: "flashcards/review", element: <ReviewMasteredView /> },
            { path: "flashcards/shared", element: <FlashcardsView /> },

            // Other Study Enhance routes
            { path: "stats", element: <h2>Statistics Page</h2> },
            { path: "settings", element: <h2>Settings Page</h2> },
          ],
        },

        // 🗣️ Rooms 
        {
          path: "room", 
          children: [
            { index: true, element: <RoomList /> }, // room list
            { path: ":roomId", element: <VideoCall /> }, // direct video call
            { path: "lobby/:roomId", element: <RoomLobby />}, // new lobby route
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
            { path: "pdf/:id", element: <PdfReader /> },
          ],
        },

        // 🗓️ Tasks 
        { path: "tasksu", element: <Tasks /> }, // Duplicated route kept
        { path: "tasks", element: <CalendarView /> },
      ],
    },
 ],
 },
]);

// Use the unified UserLoginStore Provider
return (
  <UserLoginStore> 
    <RouterProvider router={router} />
  </UserLoginStore> 
);
}

export default App;
