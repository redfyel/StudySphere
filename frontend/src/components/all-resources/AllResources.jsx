import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import "./AllResources.css";
import { BiLike, BiSolidLike } from "react-icons/bi";
import {
  IoSaveOutline,
  IoDocumentsOutline,
  IoCloudUploadOutline,
  IoBookmarkOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
  IoBookmark
} from "react-icons/io5";
import { FaRegComments } from "react-icons/fa6";
import { GrAttachment } from "react-icons/gr";
import Sidebar from "../sidebar/Sidebar";
import Dropdown from "../dropdown/Dropdown";
import Tooltip from "../tooltips/Tooltip";
import axios from "axios";
import { UserLoginContext } from "../../contexts/UserLoginContext";
import Loading from "../loading/Loading";

const CommentModal = ({ resource, comments, onClose, onSubmit, newComment, setNewComment }) => {
    if (!resource) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Comments for "{resource.title}"</h3>
                    <button onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="comments-list">
                        {comments && comments.length > 0 ? (
                            comments.map((comment, index) => (
                                <div key={index} className="comment">
                                    <p><strong>{comment.username}</strong>: {comment.text}</p>
                                    <span className="comment-date">{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <p className="no-comments-message">No comments yet.</p>
                        )}
                    </div>
                    <form onSubmit={onSubmit} className="comment-form">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            required
                        />
                        <button type="submit">Submit Comment</button>
                    </form>
                </div>
            </div>
        </div>
    );
};


export default function AllResources() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("recent");
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLibrary, setUserLibrary] = useState(new Set());
  const [userLikes, setUserLikes] = useState(new Set());
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");


  const { token, isAuthenticated, isAuthLoading, user } = useContext(UserLoginContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const navItems = [
    { name: "All Resources", path: "/resources", icon: <IoDocumentsOutline /> },
    {
      name: "Upload Resource",
      path: "/resources/upload",
      icon: <IoCloudUploadOutline />,
    },
    {
      name: "My Library",
      path: "/resources/library",
      icon: <IoBookmarkOutline />,
    },
    {
      name: "Group Resources",
      path: "/resources/groups",
      icon: <IoPeopleOutline />,
    },
  ];


  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      const fetchResources = async () => {
        try {
          const config = { headers: { "x-auth-token": token } };
          const resourcesRes = await axios.get("https://studysphere-n4up.onrender.com/api/resources", config);
          const userRes = await axios.get("https://studysphere-n4up.onrender.com/api/auth/me", config);

          setResources(resourcesRes.data);
          
          // ✅ FIX: Use optional chaining and nullish coalescing to ensure savedResources and likedResources are arrays.
          setUserLibrary(new Set(userRes.data.savedResources?.map(id => id.toString()) ?? []));
          setUserLikes(new Set(userRes.data.likedResources?.map(id => id.toString()) ?? []));
          
          setIsLoading(false);
        } catch (err) {
          console.error("Error fetching resources or user data:", err);
          setError("Failed to load data. Please try again later.");
          setIsLoading(false);
        }
      };

      fetchResources();
    } else if (!isAuthLoading && !isAuthenticated) {
      setError("You must be logged in to view resources.");
      setIsLoading(false);
    }
  }, [token, isAuthenticated, isAuthLoading, user]);


  const handleCommentClick = async (e, resourceId) => {
    e.preventDefault();
    if (!isAuthenticated) {
        setError("You must be logged in to perform this action.");
        return;
    }
    
    try {
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get(`https://studysphere-n4up.onrender.com/api/resources/${resourceId}/comments`, config);
        const resourceToComment = resources.find(r => r._id === resourceId);
        setSelectedResource(resourceToComment);
        setComments(res.data.comments || []);
        setShowCommentModal(true);
    } catch (err) {
        console.error("Error fetching comments:", err);
        setError("Failed to load comments.");
    }
  };


  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.post(
            `https://studysphere-n4up.onrender.com/api/resources/comment`,
            { resourceId: selectedResource._id, comment: newComment },
            config
        );
        setComments(prevComments => [...(prevComments || []), res.data.newComment]); 
        setNewComment("");
    } catch (err) {
        console.error("Error submitting comment:", err);
        setError("Failed to submit comment.");
    }
  };


  const handleAction = async (e, resourceId, actionType) => {
    e.preventDefault();
    if (!isAuthenticated) {
        setError("You must be logged in to perform this action.");
        return;
    }
    
    try {
        const config = { headers: { 'x-auth-token': token } };
        
        await axios.post(
            `https://studysphere-n4up.onrender.com/api/auth/action`, // Action endpoint now updates the user's document
            { resourceId, actionType },
            config
        );
        
        if (actionType === 'save') {
            const isSaved = userLibrary.has(resourceId);
            const newLibrary = new Set(userLibrary);
            if (isSaved) {
                newLibrary.delete(resourceId);
            } else {
                newLibrary.add(resourceId);
            }
            setUserLibrary(newLibrary);
        } else if (actionType === 'like') {
            const isLiked = userLikes.has(resourceId);
            const newLikes = new Set(userLikes);
            if (isLiked) {
                newLikes.delete(resourceId);
            } else {
                newLikes.add(resourceId);
            }
            setUserLikes(newLikes);
        }
    } catch (err) {
        console.error(`Error performing action: ${actionType}`, err);
        setError(`Failed to perform action: ${actionType}`);
    }
  };

  const subjectOptions = [
    { value: "", label: "All Subjects" },
    ...[...new Set(resources.map((r) => r.subject))].map((s) => ({
      value: s,
      label: s,
    })),
  ];

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "pdf", label: "PDF" },
    { value: "video", label: "Video" },
    { value: "link", label: "Link" },
  ];

  const sortOptions = [
    { value: "recent", label: "Recently Uploaded" },
    { value: "popular", label: "Popular" },
  ];

  const handleSubjectSelect = (option) => setSubject(option.value);
  const handleTypeSelect = (option) => setType(option.value);
  const handleSortSelect = (option) => setSort(option.value);

  const filtered = resources
    .filter(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) &&
        (subject === "" || r.subject === r.subject) &&
        (type === "" || r.resourceType === type)
    )
    .sort((a, b) => {
      if (sort === "recent") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sort === "popular") {
        return b.popularity - a.popularity;
      }
      return 0;
    });

  if (isLoading) {
    return <Loading/>
  }

  if (error) {
    return (
      <div className="resources-page-layout">
        <Sidebar
          sectionName="Resources"
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
          items={navItems}
        />
        <div className={`resources-page-content ${isCollapsed ? "collapsed" : ""}`}>
          <div className="error-state">
            <p className="error-message">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="resources-page-layout">
      <Sidebar
        sectionName="Resources"
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        items={navItems}
      />
      <div
        className={`resources-page-content ${isCollapsed ? "collapsed" : ""}`}
      >
        <div className="search-row">
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
          />
          <Dropdown
            options={subjectOptions}
            onSelect={handleSubjectSelect}
            placeholder={
              subjectOptions.find((opt) => opt.value === subject)?.label ||
              "All Subjects"
            }
          />
          <Dropdown
            options={typeOptions}
            onSelect={handleTypeSelect}
            placeholder={
              typeOptions.find((opt) => opt.value === type)?.label ||
              "All Types"
            }
          />
          <Dropdown
            options={sortOptions}
            onSelect={handleSortSelect}
            placeholder={
              sortOptions.find((opt) => opt.value === sort)?.label || "Sort by"
            }
          />
        </div>
        <div className="resource-grid">
          {filtered.map((r) => (
            <div key={r._id} className="resource-card-link">
              <Link
                to={r.resourceType === "file" ? `/resources/pdf/${r._id}` : r.linkURL}
                target={r.resourceType === "link" ? "_blank" : "_self"}
              >
                <div className="resource-card">
                  <div className="preview-box">
                    {r.resourceType === "file" && (
                      <img src={r.thumbnail || `https://placehold.co/100x140?text=${r.subject}`} alt="PDF Preview" />
                    )}
                  </div>
                  <h3>{r.title}</h3>
                  <p className="author">By {r.author || "Unknown"}</p>
                  <div className="card-actions">
                    <Tooltip content="Like Resource">
                      <button
                        className={`resource-icon-btn ${userLikes.has(r._id) ? 'liked' : ''}`}
                        onClick={(e) => handleAction(e, r._id, 'like')}
                      >
                        {userLikes.has(r._id) ? <BiSolidLike /> : <BiLike />}
                      </button>
                    </Tooltip>

                    <Tooltip content="Save to Library">
                      <button
                        className={`resource-icon-btn ${userLibrary.has(r._id) ? 'saved' : ''}`}
                        onClick={(e) => handleAction(e, r._id, 'save')}
                      >
                        {userLibrary.has(r._id) ? <IoBookmark /> : <IoSaveOutline />}
                      </button>
                    </Tooltip>

                    <Tooltip content="View Comments">
                      <button
                        className="resource-icon-btn"
                        onClick={(e) => handleCommentClick(e, r._id)}
                      >
                        <FaRegComments />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      {showCommentModal && (
        <CommentModal
          resource={selectedResource}
          comments={comments}
          onClose={() => setShowCommentModal(false)}
          onSubmit={handleCommentSubmit}
          newComment={newComment}
          setNewComment={setNewComment}
        />
      )}
    </div>
  );
}
