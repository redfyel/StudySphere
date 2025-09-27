# 🎓 StudySphere

> The All-In-One Platform for Collaborative and Intelligent Learning.

![StudySphere Demo](https://i.imgur.com/your-demo-image.gif)  <!-- TODO: Replace with a GIF or screenshot of your application's dashboard -->

---

## 📖 About The Project

StudySphere is a modern, feature-rich web application designed to revolutionize how students learn, collaborate, and manage their academic lives. It combines real-time communication, resource sharing, AI-powered learning tools, and wellness tracking into a single, cohesive platform. Whether you need to host a late-night study session, generate flashcards from your notes, or simply track your study habits, StudySphere has you covered.

---

## ✨ Key Features

StudySphere is packed with features to enhance every aspect of the learning experience:

### 🤝 Collaborative Study Rooms
- *🌐 Public & Private Rooms:* Create or join public rooms on any topic, or create private, invite-only rooms for focused group sessions.
- *📹 High-Quality Video & Audio:* Real-time, low-latency video and audio chat to facilitate seamless communication.
- *🎵 Integrated Music:* Share and listen to study playlists together directly within the room to stay motivated.
- *⏱ Session Timer:* Keep track of study hours with an integrated timer, which contributes to your position on the leaderboard.

### 📚 Resource Hub
- *👍 Like, Save & Comment:* Interact with shared resources. Save important documents to your personal library, upvote helpful materials, and discuss topics in the comments.
- *📄 Integrated PDF Reader:* Open and read PDF documents directly in the app without needing to download them.
- *📊 Reading Analytics:* The platform cleverly tracks and displays the average time users take to read a specific PDF, helping you manage your study schedule.

### 😊 Wellness Tracker
- *📝 Log Session Vibes:* After each study session, log your "vibe" to understand how different subjects or study times affect your focus and mood.
- *📅 Daily Mood Tracking:* Log your overall mood each day to build a comprehensive picture of your well-being.
- *📈 Mood Analysis:* Visualize your mood and session data with insightful charts, broken down by daily, weekly, and monthly periods.

### 🧠 SmartLearn AI Tools
- *🗺 Mind Map Generation:* Automatically generate structured mind maps from your notes or text, helping you visualize complex information.
- *🃏 Flashcard Generation:* Instantly create decks of flashcards from your study materials to supercharge your revision and active recall practice.

### 🏆 Leaderboard
- *🔥 Study Streak:* Stay motivated by building a daily study streak. The leaderboard showcases users with the longest streaks.
- *⏰ Study Hours:* Compete and climb the ranks based on the total number of hours you've clocked in the study rooms.

---

## 🛠 Technology Stack

This project is built with a modern and scalable MERN-like stack:

*Frontend:*
- *⚛ React.js:* A powerful JavaScript library for building user interfaces.
- *🔄 React Router:* For client-side routing and navigation.
- *🎨 CSS & Custom Styling:* For a unique and responsive design.
- *🌐 Axios:* For making API requests to the backend.
- *🔌 Socket.IO Client:* For real-time communication.

*Backend:*
- *🟩 Node.js:* A JavaScript runtime for the server.
- *🚀 Express.js:* A fast and minimalist web framework for Node.js.
- *🍃 MongoDB with Mongoose:* A NoSQL database for storing all application data, including users, resources, and rooms.
- *🔑 JSON Web Tokens (JWT):* For secure user authentication and authorization.
- *🔌 Socket.IO:* For enabling real-time, bidirectional communication.
- *🔥 Firebase:* (Specify usage, e.g., for file storage, authentication, etc. if applicable)

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- *Node.js* (v16 or later)
- *npm* or *yarn*
- *MongoDB Atlas* account or a local MongoDB instance.

### Installation & Setup

1.  *Clone the repository:*
    sh
    git clone https://github.com/redfyel/StudySphere.git
    cd StudySphere
    

2.  *Backend Setup:*
    sh
    # Navigate to the backend folder
    cd backend

    # Install NPM packages
    npm install

    # Create a .env file in the 'backend' root and add your environment variables
    # (see the .env example section below)
    touch .env

    # Start the backend server
    npm run dev
    

3.  *Frontend Setup:*
    sh
    # Navigate to the frontend folder from the root directory
    cd frontend

    # Install NPM packages
    npm install

    # Create a .env file in the 'frontend' root
    touch .env

    # Start the frontend development server
    npm start
    

### Environment Variables

You will need to create .env files for both the frontend and backend.

#### Backend (backend/.env)
```env
# Your MongoDB connection string
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<database_name>?retryWrites=true&w=majority

# A long, random, and secret string for signing JWTs
JWT_SECRET=your_super_secret_jwt_key

# The URL of your frontend application
FRONTEND_URL=http://localhost:3000
