import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import "./MyLibrary.css";
import { BiLike } from "react-icons/bi";
import { FaRegComments } from "react-icons/fa6";
import { GrAttachment } from "react-icons/gr";
import { IoSaveOutline, IoDocumentsOutline, IoCloudUploadOutline, IoBookmarkOutline, IoPeopleOutline, IoStatsChartOutline } from "react-icons/io5";
import Sidebar from '../sidebar/Sidebar'
// ✅ Sidebar items (Resource Hub)
const navItems = [
  { name: "All Resources", path: "/resources", icon: <IoDocumentsOutline /> },
  { name: "Upload Resource", path: "/resources/upload", icon: <IoCloudUploadOutline /> },
  { name: "My Library", path: "/resources/library", icon: <IoBookmarkOutline /> },
  { name: "Group Resources", path: "/resources/groups", icon: <IoPeopleOutline /> },
  { name: "Trending", path: "/resources/trending", icon: <IoStatsChartOutline /> },
];


// Sample data for saved resources
const savedResources = [
  {
    id: 1,
    title: "Math Notes",
    author: "Dr. Smith",
    type: "pdf",
    subject: "Math",
    thumbnail: "https://imgv2-1-f.scribdassets.com/img/document/384088861/original/b5633f3ee1/1667609834?v=1",
    url: "https://www.africau.edu/images/default/sample.pdf",
  },
  {
    id: 3,
    title: "Chemistry Guide",
    author: "Dr. Brown",
    type: "pdf",
    subject: "Chemistry",
    thumbnail: "https://www.bing.com/th/id/OIP.WpNTI71d4f-oqWj6pY1ElQHaJ4?w=160&h=211&c=8&rs=1&qlt=70&o=7&cb=thws5&dpr=1.5&pid=3.1&rm=3",
    url: "https://www.adobe.com/support/products/enterprise/acs/pdfs/acs_ecomm_wp.pdf",
  },
  {
    id: 5,
    title: "Algebra Cheat Sheet",
    author: "Tutor Sam",
    type: "pdf",
    subject: "Math",
    thumbnail: "https://www.edn.com/eeweb-content/wp-content/uploads/algebra.png",
    url: "https://arxiv.org/pdf/quant-ph/0410100.pdf",
  },
];

export default function MyLibraryPage() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  return (
    <div className="my-library-page-content">
        <Sidebar
        sectionName="Resources"
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        items={navItems}
      />
      
      <h2 className="page-title">My Library</h2>
      <p className="page-description">Your saved resources for quick access.</p>
      
      {savedResources.length > 0 ? (
        <div className="resource-grid">
          {savedResources.map((r) => (
            <Link to={`/resources/pdf/${r.id}`} key={r.id} className="resource-card-link">
              <div className="resource-card">
                {/* Preview */}
                <div className="preview-box">
                  {r.type === "pdf" && <img src={r.thumbnail} alt="PDF Preview" />}
                  {r.type === "video" && (
                    <video controls>
                      <source src={r.url} type="video/mp4" />
                    </video>
                  )}
                </div>
                {/* Details */}
                <h3>{r.title}</h3>
                <p className="author">By {r.author}</p>
                {/* Actions */}
                <div className="card-actions">
                  <button className="icon-btn" onClick={(e) => e.preventDefault()}><BiLike /></button>
                  <button className="icon-btn" onClick={(e) => e.preventDefault()}><IoSaveOutline /></button>
                  <button className="icon-btn" onClick={(e) => e.preventDefault()}><FaRegComments /></button>
                  <button className="icon-btn" onClick={(e) => e.preventDefault()}><GrAttachment /></button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="no-resources-message">You have no saved resources yet.</p>
      )}
    </div>
  );
}