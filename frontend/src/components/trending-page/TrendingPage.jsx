import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BiLike } from "react-icons/bi";
import { IoSaveOutline } from "react-icons/io5";
import { FaRegComments } from "react-icons/fa6";
import { GrAttachment } from "react-icons/gr";
import { FaTrophy } from "react-icons/fa";
import {IoDocumentsOutline, IoCloudUploadOutline, IoBookmarkOutline, IoPeopleOutline, IoStatsChartOutline } from "react-icons/io5";
import "./TrendingPage.css";
import Sidebar from '../sidebar/Sidebar'

 // ✅ Sidebar items
  const navItems = [
    { name: "All Resources", path: "/resources", icon: <IoDocumentsOutline /> },
    { name: "Upload Resource", path: "/upload", icon: <IoCloudUploadOutline /> },
    { name: "My Library", path: "/my-library", icon: <IoBookmarkOutline /> },
    { name: "Group Resources", path: "/groups", icon: <IoPeopleOutline /> },
    { name: "Trending", path: "/trending", icon: <IoStatsChartOutline /> },
  ];
// Sample data for trending resources (sorted by likes/saves)
const trendingResources = [
  {
    id: 1,
    title: "Math Notes",
    author: "Dr. Smith",
    type: "pdf",
    subject: "Math",
    thumbnail: "https://imgv2-1-f.scribdassets.com/img/document/384088861/original/b5633f3ee1/1667609834?v=1",
    likes: 150,
    saves: 90,
  },
  {
    id: 4,
    title: "Biology Seminar",
    author: "Dr. Clark",
    type: "video",
    subject: "Biology",
    url: "https://www.w3schools.com/html/movie.mp4",
    likes: 120,
    saves: 75,
  },
  {
    id: 2,
    title: "Physics Lecture",
    author: "Prof. Johnson",
    type: "video",
    subject: "Physics",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    likes: 105,
    saves: 60,
  },
  {
    id: 3,
    title: "Chemistry Guide",
    author: "Dr. Brown",
    type: "pdf",
    subject: "Chemistry",
    thumbnail: "https://www.bing.com/th/id/OIP.WpNTI71d4f-oqWj6pY1ElQHaJ4?w=160&h=211&c=8&rs=1&qlt=70&o=7&cb=thws5&dpr=1.5&pid=3.1&rm=3",
    likes: 80,
    saves: 50,
  },
];

// Sample data for user leaderboard
const leaderboard = [
  { id: 1, name: "Dr. Smith", contributions: 25 },
  { id: 2, name: "Prof. Johnson", contributions: 22 },
  { id: 3, name: "Tutor Sam", contributions: 18 },
  { id: 4, name: "Dr. Clark", contributions: 15 },
  { id: 5, name: "Dr. Brown", contributions: 12 },
];

export default function TrendingPage() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const renderResourceCard = (r) => (
    <Link to={`/resources/pdf/${r.id}`} key={r.id} className="resource-card-link">
      <div className="resource-card">
        <div className="preview-box">
          {r.type === "pdf" && <img src={r.thumbnail} alt="PDF Preview" />}
          {r.type === "video" && <video controls><source src={r.url} type="video/mp4" /></video>}
        </div>
        <h3>{r.title}</h3>
        <p className="author">By {r.author}</p>
        <div className="card-actions">
          <button className="icon-btn" onClick={(e) => e.preventDefault()}><BiLike /> {r.likes}</button>
          <button className="icon-btn" onClick={(e) => e.preventDefault()}><IoSaveOutline /> {r.saves}</button>
          <button className="icon-btn" onClick={(e) => e.preventDefault()}><FaRegComments /></button>
          <button className="icon-btn" onClick={(e) => e.preventDefault()}><GrAttachment /></button>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="trending-page-container">
        <Sidebar
        sectionName="Resources"
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        items={navItems}
      />
      
      <h2 className="page-title">Trending Resources 🔥</h2>
      <p className="page-description">The most popular resources, updated daily.</p>
      
      <div className="trending-resources-grid">
        {trendingResources.map(renderResourceCard)}
      </div>

      <div className="leaderboard-section">
        <h3 className="section-title">Top Contributors <FaTrophy className="trophy-icon" /></h3>
        <ul className="leaderboard-list">
          {leaderboard.map((user, index) => (
            <li key={user.id} className="leaderboard-item">
              <span className="rank">{index + 1}.</span>
              <span className="user-name">{user.name}</span>
              <span className="contributions">{user.contributions} contributions</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}