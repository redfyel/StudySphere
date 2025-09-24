import React, { useState } from "react";
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


// Import your PDF files directly from the src/assets/pdfs directory
import mathNotes from "../../assets/pdfs/mathNotes.pdf";

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("recent");

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
  const resources = [
    // ... your resources data remains unchanged
    {
      id: 1,
      title: "Maths Notes",
      author: "Dr. Smith",
      type: "pdf",
      subject: "Math",
      thumbnail:
        "https://imgv2-1-f.scribdassets.com/img/document/384088861/original/b5633f3ee1/1667609834?v=1",
      url: mathNotes,
    },
    {
      id: 2,
      title: "Physics Lecture",
      author: "Prof. Johnson",
      type: "video",
      subject: "Physics",
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
    {
      id: 3,
      title: "Chemistry Guide",
      author: "Dr. Brown",
      type: "pdf",
      subject: "Chemistry",
      thumbnail:
        "https://www.bing.com/th/id/OIP.WpNTI71d4f-oqWj6pY1ElQHaJ4?w=160&h=211&c=8&rs=1&qlt=70&o=7&cb=thws5&dpr=1.5&pid=3.1&rm=3",
      url: mathNotes,
    },
    {
      id: 4,
      title: "Environmental Sciences",
      author: "Dr. Clark",
      type: "video",
      subject: "Biology",
      url: "https://www.w3schools.com/html/movie.mp4",
    },
    {
      id: 5,
      title: "Algebra Cheat Sheet",
      author: "Tutor Sam",
      type: "pdf",
      subject: "Math",
      thumbnail:
        "https://www.edn.com/eeweb-content/wp-content/uploads/algebra.png",
      url: mathNotes,
    },
    {
      id: 6,
      title: "Discrete Mathematics ",
      author: "Dr. Smith",
      type: "pdf",
      subject: "Math",
      thumbnail:
        "https://imgv2-1-f.scribdassets.com/img/document/384088861/original/b5633f3ee1/1667609834?v=1",
      url: mathNotes,
    },
    {
      id: 7,
      title: "Engineering Physics",
      author: "Prof. Johnson",
      type: "video",
      subject: "Physics",
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
    {
      id: 8,
      title: "Engineering Chemistry",
      author: "Dr. Brown",
      type: "pdf",
      subject: "Chemistry",
      thumbnail:
        "https://www.bing.com/th/id/OIP.WpNTI71d4f-oqWj6pY1ElQHaJ4?w=160&h=211&c=8&rs=1&qlt=70&o=7&cb=thws5&dpr=1.5&pid=3.1&rm=3",
      url: mathNotes,
    },
    {
      id: 9,
      title: "Life Sciences",
      author: "Dr. Clark",
      type: "video",
      subject: "Biology",
      url: "https://www.w3schools.com/html/movie.mp4",
    },
    {
      id: 10,
      title: "Probability and Statistics",
      author: "Tutor Sam",
      type: "pdf",
      subject: "Math",
      thumbnail:
        "https://www.edn.com/eeweb-content/wp-content/uploads/algebra.png",
      url: mathNotes,
    },
  ];

  // ✅ 2. DEFINE OPTIONS FOR EACH DROPDOWN
  const subjectOptions = [
    { value: "", label: "All Subjects" },
    // This dynamically creates options from your resources data
    ...[...new Set(resources.map((r) => r.subject))].map((s) => ({
      value: s,
      label: s,
    })),
  ];

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "pdf", label: "PDF" },
    { value: "video", label: "Video" },
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
        (type === "" || r.type === type)
    )
    .sort((a, b) => {
      if (sort === "popular") {
        return b.id - a.id;
      }
      return 0;
    });

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
          {/* ✅ 4. REPLACE <select> WITH <Dropdown> */}
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
              to={`/resources/pdf/${r.id}`}
              key={r.id}
              className="resource-card-link"
            >
              <div className="resource-card">
                <div className="preview-box">
                  {r.type === "pdf" && (
                    <img src={r.thumbnail} alt="PDF Preview" />
                  )}
                  {r.type === "video" && (
                    <video controls>
                      <source src={r.url} type="video/mp4" />
                    </video>
                  )}
                </div>
                <h3>{r.title}</h3>
                <p className="author">By {r.author}</p>
                <div className="card-actions">
                  {/* ✅ 2. WRAP EACH BUTTON WITH THE TOOLTIP COMPONENT */}
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
