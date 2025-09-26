import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BiLike } from "react-icons/bi";
import { IoSaveOutline, IoDocumentsOutline, IoCloudUploadOutline, IoBookmarkOutline, IoPeopleOutline, IoStatsChartOutline } from "react-icons/io5";
import { FaRegComments } from "react-icons/fa6";
import { GrAttachment } from "react-icons/gr";
import "./GroupResources.css";
import Sidebar from '../sidebar/Sidebar'

// ✅ Sidebar items (Resource Hub)
const navItems = [
  { name: "All Resources", path: "/resources", icon: <IoDocumentsOutline /> },
  { name: "Upload Resource", path: "/resources/upload", icon: <IoCloudUploadOutline /> },
  { name: "My Library", path: "/resources/library", icon: <IoBookmarkOutline /> },
  { name: "Group Resources", path: "/resources/groups", icon: <IoPeopleOutline /> },
];


// Sample data for a group's resources and pinned items
const groupResources = [
  {
    id: 1,
    title: "Math Notes",
    author: "Dr. Smith",
    type: "pdf",
    subject: "Math",
    thumbnail: "https://imgv2-1-f.scribdassets.com/img/document/384088861/original/b5633f3ee1/1667609834?v=1",
    url: "https://www.africau.edu/images/default/sample.pdf",
    isPinned: false,
  },
  {
    id: 2,
    title: "Physics Lecture",
    author: "Prof. Johnson",
    type: "video",
    subject: "Physics",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    isPinned: true, // This one is pinned
  },
  {
    id: 3,
    title: "Chemistry Guide",
    author: "Dr. Brown",
    type: "pdf",
    subject: "Chemistry",
    thumbnail: "https://www.bing.com/th/id/OIP.WpNTI71d4f-oqWj6pY1ElQHaJ4?w=160&h=211&c=8&rs=1&qlt=70&o=7&cb=thws5&dpr=1.5&pid=3.1&rm=3",
    url: "https://www.adobe.com/support/products/enterprise/acs/pdfs/acs_ecomm_wp.pdf",
    isPinned: false,
  },
  {
    id: 6,
    title: "Study Tips for Exams",
    author: "Admin",
    type: "link",
    subject: "Tips",
    url: "https://www.forbes.com/sites/forbesbooksauthors/2021/05/26/10-tips-for-exam-success/",
    isPinned: true, // This one is also pinned
  },
];

const pinnedResources = groupResources.filter(r => r.isPinned);
const otherResources = groupResources.filter(r => !r.isPinned);

export default function GroupResources() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim() !== "") {
      setComments([...comments, { id: Date.now(), user: "You", text: newComment }]);
      setNewComment("");
    }
  };

  const renderResourceCard = (r) => (
    <Link to={`/resources/pdf/${r.id}`} key={r.id} className="resource-card-link">
      <div className="resource-card">
        <div className="preview-box">
          {r.type === "pdf" && <img src={r.thumbnail} alt="PDF Preview" />}
          {r.type === "video" && <video controls><source src={r.url} type="video/mp4" /></video>}
          {r.type === "link" && <p className="link-preview">🔗 Link Preview</p>}
        </div>
        <h3>{r.title}</h3>
        <p className="author">By {r.author}</p>
        <div className="card-actions">
          <button className="icon-btn" onClick={(e) => e.preventDefault()}><BiLike /></button>
          <button className="icon-btn" onClick={(e) => e.preventDefault()}><IoSaveOutline /></button>
          <button className="icon-btn" onClick={(e) => e.preventDefault()}><FaRegComments /></button>
          <button className="icon-btn" onClick={(e) => e.preventDefault()}><GrAttachment /></button>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="group-resources-page">
        <Sidebar
        sectionName="Resources"
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        items={navItems}
      />
      <div className={`resources-page-content ${isCollapsed ? "collapsed" : ""}`}>
      <h2 className="group-title">Group Name's Resources</h2>
      <p className="group-description">This is the shared space for our group.</p>

      {/* Pinboard Section */}
      {pinnedResources.length > 0 && (
        <>
          <h3 className="section-title">📌 Pinboard</h3>
          <div className="pinboard-grid">
            {pinnedResources.map(renderResourceCard)}
          </div>
        </>
      )}

      {/* Other Resources Section */}
      <h3 className="section-title">All Shared Resources</h3>
      <div className="resource-grid">
        {otherResources.map(renderResourceCard)}
      </div>

      {/* Comment System */}
      <div className="comment-section">
        <h3 className="section-title">Study Tips & Comments</h3>
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment">
              <strong>{comment.user}:</strong> {comment.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a study tip or comment..."
            className="comment-input"
          />
          <button type="submit" className="comment-btn">Post</button>
        </form>
      </div>
    </div>
    </div>
  );
}