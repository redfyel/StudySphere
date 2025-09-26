import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import "./AllResources.css";
import { BiLike } from "react-icons/bi";
import {
  IoSaveOutline,
  IoDocumentsOutline,
  IoCloudUploadOutline,
  IoBookmarkOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
} from "react-icons/io5";
import { FaRegComments } from "react-icons/fa6";
import { GrAttachment } from "react-icons/gr";
import Sidebar from "../sidebar/Sidebar";
import Dropdown from "../dropdown/Dropdown";
import Tooltip from "../tooltips/Tooltip";
import axios from "axios";
import { UserLoginContext } from "../../contexts/UserLoginContext";

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("recent");
  const [resources, setResources] = useState([]); // Will store fetched resources
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { token, isAuthenticated } = useContext(UserLoginContext);

  const navItems = [
    { name: "All Resources", path: "/resources", icon: <IoDocumentsOutline /> },
    {
      name: "Upload Resource",
      path: "/resources/upload",
      icon: <IoCloudUploadOutline />,
    },
    {
      name: "My Library",
      path: "/resources/my-library",
      icon: <IoBookmarkOutline />,
    },
    {
      name: "Group Resources",
      path: "/resources/groups",
      icon: <IoPeopleOutline />,
    },
    {
      name: "Trending",
      path: "/resources/trending",
      icon: <IoStatsChartOutline />,
    },
  ];

  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  
  // ✅ NEW: Fetch resources from the backend
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };
        const res = await axios.get("http://localhost:5000/api/resources", config);
        setResources(res.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching resources:", err);
        setError("Failed to load resources. Please try again later.");
        setIsLoading(false);
      }
    };
    if (isAuthenticated) {
      fetchResources();
    } else {
      setIsLoading(false); // If not authenticated, stop loading but show no resources
    }
  }, [token, isAuthenticated]);

  // ✅ 2. DEFINE OPTIONS FOR EACH DROPDOWN
  const subjectOptions = [
    { value: "", label: "All Subjects" },
    // This dynamically creates options from your fetched resources
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

  // ✅ 3. CREATE HANDLER FUNCTIONS
  const handleSubjectSelect = (option) => setSubject(option.value);
  const handleTypeSelect = (option) => setType(option.value);
  const handleSortSelect = (option) => setSort(option.value);

  const filtered = resources
    .filter(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) &&
        (subject === "" || r.subject === subject) &&
        (type === "" || r.resourceType === type) // Changed r.type to r.resourceType
    )
    .sort((a, b) => {
      if (sort === "recent") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      // Assuming a 'popularity' field in your database for this to work
      if (sort === "popular") {
        return b.popularity - a.popularity;
      }
      return 0;
    });

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
            <p>Loading resources...</p>
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
            <Link
              to={`/resources/pdf/${r._id}`} // Use MongoDB's _id
              key={r._id}
              className="resource-card-link"
            >
              <div className="resource-card">
                <div className="preview-box">
                  {r.resourceType === "file" && (
                    <img src={r.thumbnail || `https://placehold.co/100x140?text=${r.subject}`} alt="PDF Preview" />
                  )}
                  {r.resourceType === "link" && (
                    <img src={r.thumbnail || `https://placehold.co/100x140?text=Link`} alt="Link Preview" />
                  )}
                  {r.resourceType === "video" && (
                    <video controls>
                      <source src={r.url} type="video/mp4" />
                    </video>
                  )}
                </div>
                <h3>{r.title}</h3>
                <p className="author">By {r.author || "Unknown"}</p>
                <div className="card-actions">
                  <Tooltip content="Like Resource">
                    <button
                      className="resource-icon-btn"
                      onClick={(e) => e.preventDefault()}
                    >
                      <BiLike />
                    </button>
                  </Tooltip>

                  <Tooltip content="Save to Library">
                    <button
                      className="resource-icon-btn"
                      onClick={(e) => e.preventDefault()}
                    >
                      <IoSaveOutline />
                    </button>
                  </Tooltip>

                  <Tooltip content="View Comments">
                    <button
                      className="resource-icon-btn"
                      onClick={(e) => e.preventDefault()}
                    >
                      <FaRegComments />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
