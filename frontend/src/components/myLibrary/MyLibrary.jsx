import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import "./MyLibrary.css";
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
import Sidebar from '../sidebar/Sidebar'
import Tooltip from "../tooltips/Tooltip";
import axios from "axios";
import { UserLoginContext } from "../../contexts/UserLoginContext";

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

export default function MyLibraryPage() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const [savedResources, setSavedResources] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userLikes, setUserLikes] = useState(new Set());
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    const { token, isAuthenticated, isAuthLoading, user } = useContext(UserLoginContext);

    const navItems = [
        { name: "All Resources", path: "/resources", icon: <IoDocumentsOutline /> },
        { name: "Upload Resource", path: "/resources/upload", icon: <IoCloudUploadOutline /> },
        { name: "My Library", path: "/resources/library", icon: <IoBookmarkOutline /> },
        { name: "Group Resources", path: "/resources/groups", icon: <IoPeopleOutline /> },
    ];

    useEffect(() => {
        if (!isAuthLoading) {
            const fetchSavedResources = async () => {
                if (!isAuthenticated) {
                    setError("You must be logged in to view your library.");
                    setIsLoading(false);
                    return;
                }
                try {
                    const config = { headers: { "x-auth-token": token } };
                    // ✅ NEW/UPDATED: Fetch saved resources from the dedicated endpoint
                    const res = await axios.get("https://studysphere-n4up.onrender.com/api/resources/mylibrary", config);
                    setSavedResources(res.data);
                    setIsLoading(false);

                    // ✅ FIX: Use the 'isLiked' field returned by the backend's aggregation pipeline
                    // The backend now provides the necessary data to initialize the likes state.
                    const likedResources = res.data.filter(r => r.isLiked).map(r => r._id);
                    setUserLikes(new Set(likedResources));

                } catch (err) {
                    console.error("Error fetching saved resources:", err);
                    setError("Failed to load your library. Please try again later.");
                    setIsLoading(false);
                }
            };
            fetchSavedResources();
        }
    }, [isAuthenticated, isAuthLoading, token, user]);

    const handleAction = async (e, resourceId, actionType) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setError("You must be logged in to perform this action.");
            return;
        }

        try {
            const config = { headers: { 'x-auth-token': token } };

            // ✅ Action now targets the Auth route to update the user document
            await axios.post(
                `https://studysphere-n4up.onrender.com/api/auth/action`,
                { resourceId, actionType },
                config
            );

            // Optimistically update the UI
            if (actionType === 'like') {
                const isLiked = userLikes.has(resourceId);
                const newLikes = new Set(userLikes);
                if (isLiked) {
                    newLikes.delete(resourceId);
                } else {
                    newLikes.add(resourceId);
                }
                setUserLikes(newLikes);
            }
            if (actionType === 'save') {
              // Since unsaving from MyLibrary should remove the card instantly,
              // we filter the resource out of the current view.
              setSavedResources(savedResources.filter(r => r._id !== resourceId));
          }
        } catch (err) {
            console.error(`Error performing action: ${actionType}`, err);
            setError(`Failed to perform action: ${actionType}`);
        }
    };

    const handleCommentClick = async (e, resourceId) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setError("You must be logged in to perform this action.");
            return;
        }
        
        try {
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.get(`https://studysphere-n4up.onrender.com/api/resources/${resourceId}/comments`, config);
            const resourceToComment = savedResources.find(r => r._id === resourceId);
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


    if (isLoading) {
        return (
            <div className="resources-page-layout">
                <Sidebar
                    sectionName="Resources"
                    isCollapsed={isCollapsed}
                    toggleSidebar={toggleSidebar}
                    items={navItems}
                />
                <div className={`resources-page-content ${isCollapsed ? "collapsed" : ""}`}>
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading your library...</p>
                    </div>
                </div>
            </div>
        );
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
            <div className={`resources-page-content ${isCollapsed ? "collapsed" : ""}`}>
                <h2 className="page-title">My Library</h2>
                
                {savedResources.length > 0 ? (
                    <div className="resource-grid">
                        {savedResources.map((r) => (
                            <div key={r._id} className="resource-card-link">
                              <Link to={`/resources/pdf/${r._id}`} className="resource-card-link">
                                <div className="resource-card">
                                    {/* Preview */}
                                    <div className="preview-box">
                                        {r.resourceType === "file" && <img src={r.thumbnail || `https://placehold.co/100x140?text=${r.subject}`} alt="PDF Preview" />}
                                        {r.resourceType === "link" && <img src={r.thumbnail || `https://placehold.co/100x140?text=Link`} alt="Link Preview" />}
                                        {r.resourceType === "video" && (
                                            <video controls>
                                                <source src={r.url} type="video/mp4" />
                                            </video>
                                        )}
                                    </div>
                                    {/* Details */}
                                    <h3>{r.title}</h3>
                                    <p className="author">By {r.author || "Unknown"}</p>
                                    {/* Actions */}
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
                                                className={`resource-icon-btn saved`} // It's always saved here
                                                onClick={(e) => handleAction(e, r._id, 'save')}
                                            >
                                                <IoBookmark />
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
                ) : (
                    <p className="no-resources-message">You have no saved resources yet.</p>
                )}
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
