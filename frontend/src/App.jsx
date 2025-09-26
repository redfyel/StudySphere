import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// --- CONTEXTS & LAYOUTS ---
// Keep AuthProvider for Protected Routes (from second file)
import { AuthProvider } from "./components/room/AuthContext";
// Use UserLoginStore as it provides broader context, often for general app state
import { UserLoginStore } from "./contexts/UserLoginContext"; 

import RootLayout from "./RootLayout";
import ProtectedRoute from "./components/room/ProtectedRoute";

// --- CORE PAGES ---
import Home from "./components/home/Home";
// Use WellnessPage (from first file) for consistency in the route
import WellnessPage from "./components/mood-tracker/Wellness"; 

// --- STUDY ENHANCE COMPONENTS (Prioritizing first file's detail) ---
import AIGenerationScreen from "./components/study-enhance/AIGenerationScreen";
import FlashcardsView from "./components/study-enhance/flashcards/FlashCardsView";
import AllDecksView from "./components/study-enhance/flashcards/AllDecksView";
import MindMapView from "./components/study-enhance/mindmaps/MindMapView";
import ReviewMasteredView from "./components/study-enhance/flashcards/ReviewMasteredView";
import AllMindMapsView from "./components/study-enhance/mindmaps/AllMindMapsView";
import ReviewMapsView from "./components/study-enhance/mindmaps/ReviewMapsView";
import StartStudyMap from "./components/study-enhance/mindmaps/StartStudyMap";
import StartStudyPage from "./components/study-enhance/flashcards/StartStudyPage";
// FlashcardsLayout from the second file is likely a wrapper, but we stick to the direct views for now.

// --- ROOMS COMPONENTS (Prioritizing second file's structure/Auth) ---
import RoomList from "./components/room/RoomList";
import VideoCall from "./components/room/VideoCall";
import AuthScreen from "./components/room/AuthScreen"; // New Auth component
import WelcomePopUp from "./components/room/WelcomePopUp"; 
import RoomLobby from "./components/room/RoomLobby"; // New Lobby component

// --- RESOURCE HUB COMPONENTS ---
import AllResources from "./components/all-resources/AllResources";
import PdfReader from "./components/pdf-reader/PdfReader";
import UploadPage from "./components/upload-page/UploadPage";
import MyLibrary from "./components/myLibrary/MyLibrary";
import GroupResources from "./components/group-resources/GroupResources";

// --- TASKS COMPONENTS (Prioritizing first file's detail) ---
import Tasks from "./components/tasks/Tasks";
import CalendarView from "./components/tasks/CalendarView";

// --- AUTH COMPONENTS (Prioritizing first file's detail, but using AuthScreen for consistency) ---
import Login from "./components/login/Login";
import Register from "./components/register/Register";
import Dashboard from "./components/dashboard/Dashboard";

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
        { path: "login", element: <Login /> }, // Kept for specificity
        { path: "register", element: <Register /> }, // Kept for specificity

        // 📊 Mood Tracker (Using WellnessPage from the first file)
        { path: "mood-tracker", element: <WellnessPage /> },

        // --- PROTECTED ROUTES START HERE ---
        // All subsequent routes are nested under a ProtectedRoute wrapper or directly use it,
        // ensuring the user must be authenticated (using the AuthProvider context).
        {
            element: <ProtectedRoute />, 
            children: [
                
                { path: "dashboard", element: <Dashboard/> },
                { path: "welcome", element: <WelcomePopUp /> },

                // 🎓 Study Enhance (Prioritizing detail from the first file)
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

                // 🗣️ Rooms (Using path "room" for consistency with Protected Structure in file 2)
                {
                    path: "room", 
                    children: [
                        { index: true, element: <RoomList /> }, // room list
                        { path: ":roomId", element: <VideoCall /> }, // direct video call
                        { path: "lobby/:roomId", element: <RoomLobby />}, // new lobby route
                    ],
                },

                // 📚 Resource Hub (Prioritizing detail from the first file)
                {
                    path: "resources",
                    children: [
                        { index: true, element: <AllResources /> },
                        { path: "upload", element: <UploadPage /> },
                        { path: "library", element: <MyLibrary /> },
                        { path: "groups", element: <GroupResources /> },
                        // { path: "trending", element: <TrendingPage /> },
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

  // Wrap with AuthProvider first, as ProtectedRoute depends on it.
  // Wrap that in UserLoginStore if it holds non-auth global state.
  return (
    <AuthProvider>
      <UserLoginStore> 
        <RouterProvider router={router} />
      </UserLoginStore>
    </AuthProvider>
  );
}

export default App;