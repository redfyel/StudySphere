// AllResources.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./AllResources.css";
import { BiLike } from "react-icons/bi";
import { IoSaveOutline } from "react-icons/io5";
import { FaRegComments } from "react-icons/fa6";
import { GrAttachment } from "react-icons/gr";

// Import your PDF files directly from the src/assets/pdfs directory
import mathNotes from "../../assets/pdfs/mathNotes.pdf";
// Assuming you have these files, update the paths accordingly
// import chemistryGuidePdf from "../../assets/pdfs/acs_ecomm_wp.pdf";
// import algebraSheetPdf from "../../assets/pdfs/0410100.pdf";

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("recent");

  // Use the imported variables in your resources object
  const resources = [
    {
      id: 1,
      title: "Maths Notes",
      author: "Dr. Smith",
      type: "pdf",
      subject: "Math",
      thumbnail: "https://imgv2-1-f.scribdassets.com/img/document/384088861/original/b5633f3ee1/1667609834?v=1",
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
      thumbnail: "https://www.bing.com/th/id/OIP.WpNTI71d4f-oqWj6pY1ElQHaJ4?w=160&h=211&c=8&rs=1&qlt=70&o=7&cb=thws5&dpr=1.5&pid=3.1&rm=3",
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
      thumbnail: "https://www.edn.com/eeweb-content/wp-content/uploads/algebra.png",
      url: mathNotes, 
    },
    {
      id: 6,
      title: "Discrete Mathematics ",
      author: "Dr. Smith",
      type: "pdf",
      subject: "Math",
      thumbnail: "https://imgv2-1-f.scribdassets.com/img/document/384088861/original/b5633f3ee1/1667609834?v=1",
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
      thumbnail: "https://www.bing.com/th/id/OIP.WpNTI71d4f-oqWj6pY1ElQHaJ4?w=160&h=211&c=8&rs=1&qlt=70&o=7&cb=thws5&dpr=1.5&pid=3.1&rm=3",
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
      title: "Prabability and Statistics",
      author: "Tutor Sam",
      type: "pdf",
      subject: "Math",
      thumbnail: "https://www.edn.com/eeweb-content/wp-content/uploads/algebra.png",
      url: mathNotes, 
    },
  ];

  const filtered = resources
    .filter((r) =>
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
    <div className="resources-page-content">
      {/* Search + Filter Button */}
      <div className="search-row">
        <input
          type="text"
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-bar"
        />
        <button className="filter-btn" onClick={() => setShowFilterModal(true)}>
          Filters
        </button>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Filters</h3>
            <label>
              Subject:
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">All Subjects</option>
                <option value="Math">Math</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </label>
            <label>
              Type:
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label>
              Sort:
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">Recently Uploaded</option>
                <option value="popular">Popular</option>
              </select>
            </label>
            <div className="modal-actions">
              <button className="button save" onClick={() => setShowFilterModal(false)}>Apply</button>
              <button className="button comment" onClick={() => setShowFilterModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Cards */}
      <div className="resource-grid">
        {filtered.map((r) => (
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
    </div>
  );
}