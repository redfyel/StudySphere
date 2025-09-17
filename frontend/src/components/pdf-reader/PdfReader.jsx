import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useParams, Link } from "react-router-dom";
import { MdClose } from "react-icons/md";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import "./PdfReader.css";

// Configure react-pdf worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PdfReader() {
  const { id } = useParams();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef(null);

  // Sample data to simulate fetching a single resource by ID
  const resources = {
    1: { id: 1, url: "https://www.pvpsiddhartha.ac.in/syllabus_23/cse/21/23BS1305.pdf", title: "Math Notes" },
    3: { id: 3, url: "https://www.adobe.com/support/products/enterprise/acs/pdfs/acs_ecomm_wp.pdf", title: "Chemistry Guide" },
    5: { id: 5, url: "https://arxiv.org/pdf/quant-ph/0410100.pdf", title: "Algebra Cheat Sheet" },
  };

  const currentResource = resources[id];

  useEffect(() => {
    // Start the timer when the component mounts
    timerIntervalRef.current = setInterval(() => {
      setTimer(prevTimer => prevTimer + 1);
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timerIntervalRef.current);
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!currentResource) {
    return <div className="loading-state">Resource not found.</div>;
  }

  return (
    <div className="pdf-reader-container">
      <div className="reader-header">
        <Link to="/resources" className="back-btn">← Back to Resources</Link>
        <div className="pdf-title-and-timer">
          <h2 className="pdf-title">{currentResource.title}</h2>
          <div className="pdf-timer">
            Reading Time: <span>{formatTime(timer)}</span>
          </div>
        </div>
        <button onClick={() => window.history.back()} className="close-btn">
          <MdClose size={24} />
        </button>
      </div>

      <div className="pdf-document-container">
        <Document
          file={currentResource.url}
          onLoadSuccess={onDocumentLoadSuccess}
          className="pdf-document"
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>

      {numPages && (
        <div className="pdf-navigation">
          <button
            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
            disabled={pageNumber <= 1}
            className="pdf-nav-btn"
          >
            Previous
          </button>
          <span>
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
            disabled={pageNumber >= numPages}
            className="pdf-nav-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}