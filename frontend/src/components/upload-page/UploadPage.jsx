import React, { useState, useContext } from "react"; // Import useContext
import "./UploadPage.css";
import { IoCloudUploadOutline } from "react-icons/io5";
import Sidebar from '../sidebar/Sidebar';
import { IoSaveOutline, IoDocumentsOutline, IoBookmarkOutline, IoPeopleOutline, IoStatsChartOutline } from "react-icons/io5";
import axios from 'axios'; // Import axios for API calls
import { UserLoginContext } from '../../contexts/UserLoginContext'; // Import your UserLoginContext

// ✅ Sidebar items (Resource Hub)
const navItems = [
  { name: "All Resources", path: "/resources", icon: <IoDocumentsOutline /> },
  { name: "Upload Resource", path: "/resources/upload", icon: <IoCloudUploadOutline /> },
  { name: "My Library", path: "/resources/library", icon: <IoBookmarkOutline /> },
  { name: "Group Resources", path: "/resources/groups", icon: <IoPeopleOutline /> },
];

export default function UploadPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState("file"); // 'file' or 'link'
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [subject, setSubject] = useState("");
  const [scope, setScope] = useState("private"); // Default to private
  const [uploading, setUploading] = useState(false); // To manage loading state
  const [error, setError] = useState(null); // To display errors
  const [success, setSuccess] = useState(null); // To display success messages

  // Access user and token from context
  const { user, token } = useContext(UserLoginContext);

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    setSuccess(null);

    // Ensure user is logged in
    if (!user || !token) {
      setError("You must be logged in to upload resources.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("resourceType", resourceType);
    formData.append("scope", scope);

    if (resourceType === "file") {
      if (!file) {
        setError("Please select a file to upload.");
        setUploading(false);
        return;
      }
      formData.append("file", file); // Append the actual file
    } else { // resourceType === "link"
      if (!link) {
        setError("Please provide a link URL.");
        setUploading(false);
        return;
      }
      formData.append("link", link);
    }

    try {
      const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': token,
      },
    };
      
      const res = await axios.post('https://studysphere-n4up.onrender.com/api/resources/upload', formData, config);
    setSuccess(res.data.msg);
      
      // Reset form
      setTitle("");
      setResourceType("file");
      setFile(null);
      setLink("");
      setSubject("");
      setScope("private");

    } catch (err) {
      console.error("Upload error:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.msg || "An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="resources-page-layout">
      <Sidebar
        sectionName="Resources"
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        items={navItems}
      />

      <div className={`resources-page-content ${isCollapsed ? "collapsed" : ""}`}>
        <h2>Upload a New Resource</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>} {/* Add success message display */}
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="title">Resource Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to React Hooks"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            >
              <option value="">Select Subject</option>
              <option value="Math">Math</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
            </select>
          </div>

          <div className="form-group resource-type-selection">
            <label>Resource Type</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="file"
                  checked={resourceType === "file"}
                  onChange={() => setResourceType("file")}
                />
                File Upload
              </label>
              <label>
                <input
                  type="radio"
                  value="link"
                  checked={resourceType === "link"}
                  onChange={() => setResourceType("link")}
                />
                Provide Link
              </label>
            </div>
          </div>

          {resourceType === "file" ? (
            <div className="form-group file-input-group">
              <label htmlFor="file-upload" className="file-upload-label">
                <IoCloudUploadOutline size={30} />
                <p>Drag & drop or click to upload a file</p>
                {file && <span className="file-name">{file.name}</span>}
              </label>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                required={resourceType === "file"} // Make required only for file type
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="link">Link URL</label>
              <input
                type="url"
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="e.g., https://www.youtube.com/watch?v=example"
                required={resourceType === "link"} // Make required only for link type
              />
            </div>
          )}

          <div className="form-group">
            <label>Access Scope</label>
            <div className="scope-options">
              <label>
                <input
                  type="radio"
                  value="private"
                  checked={scope === "private"}
                  onChange={(e) => setScope(e.target.value)}
                />
                Private
              </label>
              <label>
                <input
                  type="radio"
                  value="public"
                  checked={scope === "public"}
                  onChange={(e) => setScope(e.target.value)}
                />
                Public
              </label>
              <label>
                <input
                  type="radio"
                  value="group"
                  checked={scope === "group"}
                  onChange={(e) => setScope(e.target.value)}
                />
                Group
              </label>
              <label>
                <input
                  type="radio"
                  value="friends"
                  checked={scope === "friends"}
                  onChange={(e) => setScope(e.target.value)}
                  disabled // You might want to enable this once group/friends functionality is implemented
                />
                Friends
              </label>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Resource"}
          </button>
        </form>
      </div>
    </div>
  );
}