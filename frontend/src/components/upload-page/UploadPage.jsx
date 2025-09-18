import React, { useState } from "react";
import "./UploadPage.css";
import { IoCloudUploadOutline } from "react-icons/io5";
import Sidebar from '../sidebar/Sidebar'
import { IoSaveOutline, IoDocumentsOutline, IoBookmarkOutline, IoPeopleOutline, IoStatsChartOutline } from "react-icons/io5";
import { FaRegComments } from "react-icons/fa6";
import { GrAttachment } from "react-icons/gr";

 // ✅ Sidebar items
  const navItems = [
    { name: "All Resources", path: "/resources", icon: <IoDocumentsOutline /> },
    { name: "Upload Resource", path: "/upload", icon: <IoCloudUploadOutline /> },
    { name: "My Library", path: "/my-library", icon: <IoBookmarkOutline /> },
    { name: "Group Resources", path: "/groups", icon: <IoPeopleOutline /> },
    { name: "Trending", path: "/trending", icon: <IoStatsChartOutline /> },
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

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send this data to a backend.
    // For this prototype, we'll just log it.
    console.log({
      title,
      subject,
      type: resourceType,
      file: resourceType === "file" ? file : null,
      link: resourceType === "link" ? link : null,
      scope,
    });

    // Reset form
    setTitle("");
    setResourceType("file");
    setFile(null);
    setLink("");
    setSubject("");
    setScope("private");
    alert("Resource uploaded!");
  };

  return (
    <div className="upload-page-container">
        <Sidebar
        sectionName="Resources"
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        items={navItems}
      />
      
      <div className="upload-form-card">
        <h2>Upload a New Resource</h2>
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
                required
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
                required
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
                />
                Friends
              </label>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Upload Resource
          </button>
        </form>
      </div>
    </div>
  );
}