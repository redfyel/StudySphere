// frontend/src/components/mindmap/MindMapView.jsx

import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import * as d3 from "d3";
import { FaBrain, FaUndo, FaRedo, FaSave, FaFileExport, FaStar, FaExpand, FaCompress, FaSitemap, FaUserFriends, FaRocket, FaArrowLeft , FaHistory} from "react-icons/fa";
import { BsLightningFill, BsCollectionFill } from "react-icons/bs";
import Sidebar from "../../sidebar/Sidebar";
import { saveSvgAsPng } from "./SaveImage"; 
import axios from "axios";
import {useToast} from '../../../contexts/ToastProvider';
import "./MindMapView.css";

// Helper function to wrap SVG text (no changes needed here).
function wrap(text, width) {
  text.each(function () {
    let text = d3.select(this), words = text.text().split(/\s+/).reverse(), word, line = [], lineNumber = 0, lineHeight = 1.0, y = text.attr("y"), dy = 0, tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

const MindMapView = () => {
  // --- 1. STATE & REFS ---
  const location = useLocation();
  const navigate = useNavigate();
  // Its only job is to receive data. If there's no state, it's an empty object.
  const { mindMapData } = location.state || {}; 
  
  const viewRef = useRef();
  const svgRef = useRef();
  const { showToast } = useToast();
  const [rotation, setRotation] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false); // Fullscreen mode
  const [timeOfDay, setTimeOfDay] = useState("night");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const sidebarItems = [
    { section: "Study", items: [ { name: "Start Studying", path: "/study-enhance/mindmaps/session", icon: <BsLightningFill /> }, { name: "Review Maps", path: "/study-enhance/mindmaps/review", icon: <FaStar /> }, ] },
    { section: "Library", items: [ { name: "All Mind Maps", path: "/study-enhance/mindmaps/all", icon: <FaSitemap /> }, { name: "Shared Mind Maps", path: "/study-enhance/mindmaps/shared", icon: <FaUserFriends /> }, ] },
    { section: "Create", items: [ { name: "Generate with AI", path: "/study-enhance/generate", icon: <FaRocket /> }, { name: "Flashcards", path: "/study-enhance/decks", icon: <BsCollectionFill /> }, ] },
  ];

  // --- 2. EFFECTS ---

  // Effect to set morning/night theme
  useEffect(() => {
    const currentHour = new Date().getHours();
    setTimeOfDay(currentHour >= 4&& currentHour < 18 ? "morning" : "night");
  }, []);

  // Effect to manage fullscreen state
  useEffect(() => {
    const onFullscreenChange = () => setIsExpanded(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Effect for D3 rendering. This now runs whenever the component receives valid mindMapData.
  useEffect(() => {
    if (!mindMapData?.mindMapData?.root) return; // Note the double .mindMapData from the saved object

    const isPreview = !isExpanded;
    const width = isPreview ? 800 : window.innerWidth;
    const height = isPreview ? 540 : window.innerHeight;
    const nodeRadius = isPreview ? 180 : 300;

    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll("*").remove();
    const svg = svgElement.attr("viewBox", [-width / 2, -height / 2, width, height]);
    const zoomPanGroup = svg.append("g");
    const rotationGroup = zoomPanGroup.append("g").attr("class", "rotation-group");

    if (isPreview) {
      rotationGroup.attr("transform", "rotate(-90)");
    }

    if (!isPreview) {
      svg.call(d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => zoomPanGroup.attr("transform", event.transform)));
    }

    const tree = d3.tree().size([2 * Math.PI, 1]).separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
    const root = d3.hierarchy(mindMapData.mindMapData.root, (d) => d.children); // Adjusted path
    root.descendants().forEach((d, i) => { d.id = i; d._children = d.children; });

     const update = (source) => {
      const duration = 500,
        padding = 10,
        nodes = root.descendants();
      tree(root);
      nodes.forEach((d) => {
        d.y = d.depth * nodeRadius;
      });
      const links = root.links();

      const link = rotationGroup
        .selectAll(".mindmap-link")
        .data(links, (d) => d.target.id);
      link
        .enter()
        .append("path")
        .attr("class", "mindmap-link")
        .merge(link)
        .transition()
        .duration(duration)
        .attr(
          "d",
          d3
            .linkRadial()
            .angle((d) => d.x)
            .radius((d) => d.y)
        );
      link.exit().transition().duration(duration).remove();

      const node = rotationGroup
        .selectAll(".mindmap-node")
        .data(nodes, (d) => d.id);
      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "mindmap-node")
        .on(
          "click",
          (event, d) =>
            !isPreview &&
            ((d.children = d.children ? null : d._children), update(d))
        );

      nodeEnter.append("rect");
      nodeEnter
        .append("text")
        .attr("class", "mindmap-node-label")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .text((d) => d.data.name)
        .call(wrap, 150);

      const indicator = nodeEnter
        .append("g")
        .attr("class", "mindmap-indicator-group");
      indicator.append("circle").attr("class", "indicator-circle").attr("r", 8);
      indicator.append("path").attr("class", "indicator-path");

      nodeEnter.each(function (d) {
        const nodeGroup = d3.select(this),
          textEl = nodeGroup.select(".mindmap-node-label"),
          rectEl = nodeGroup.select("rect"),
          bbox = textEl.node().getBBox(),
          // Correct text rotation based on the new default orientation
          isLeft = isPreview
            ? d.x > 0 && d.x < Math.PI
            : d.x > Math.PI / 2 && d.x < (Math.PI * 3) / 2;
        rectEl
          .attr("class", `level-${d.depth}`)
          .attr("width", bbox.width + padding * 2)
          .attr("height", bbox.height + padding * 2)
          .attr("x", -bbox.width / 2 - padding)
          .attr("y", -bbox.height / 2 - padding);
        textEl.attr("transform", `rotate(${isLeft ? 180 : 0})`);
        const indicatorX = bbox.width / 2 + padding + 12;
        nodeGroup
          .select(".mindmap-indicator-group")
          .attr("transform", `translate(${indicatorX}, 0)`);
      });

      const nodeUpdate = node
        .merge(nodeEnter)
        .transition()
        .duration(duration)
        .attr(
          "transform",
          (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y}, 0)`
        );
      nodeUpdate
        .select(".indicator-path")
        .transition()
        .duration(duration)
        .attr("d", (d) => (d.children ? "M-4,0H4" : "M-4,0H4 M0,-4V4"));
      nodeUpdate
        .select(".mindmap-indicator-group")
        .transition()
        .duration(duration)
        .style("opacity", (d) =>
          (d._children || d.children) && !isPreview ? 1 : 0
        );

      node.exit().transition().duration(duration).remove();
    };
    update(root);
  }, [mindMapData, isExpanded, timeOfDay]);

  // Effect for interactive rotation in fullscreen
  useEffect(() => {
    if (svgRef.current && isExpanded) {
      d3.select(svgRef.current).select(".rotation-group").transition().duration(300).attr("transform", `rotate(${rotation})`);
    }
  }, [rotation, isExpanded]);
  
  // --- 3. HANDLERS ---
  const enterFullScreen = () => viewRef.current?.requestFullscreen();
  const exitFullScreen = () => document.fullscreenElement && document.exitFullscreen();
  const handleSaveImage = () => {
    if (svgRef.current) {
      const title = mindMapData?.title || "mindmap";
      saveSvgAsPng(svgRef.current, `${title.replace(/\s+/g, '_')}.png`);
    }
  };

  const handleLogReview = async () => {
    if (!mindMapData?._id) return; // Can't log if there's no ID

    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    
    try {
        await axios.post(`https://studysphere-n4up.onrender.com/api/mindmaps/${mindMapData._id}/sessions`, {}, config);
        // Give the user clear feedback!
        showToast(`Review session for "${mindMapData.title}" logged successfully!`, "info");
    } catch (err) {
        console.error("Failed to log review session", err);
        showToast("Could not log review session. Please try again.", "error");
    }
};

const handleStartStudying = () => {
        if (!mindMapData) return;
        // Navigate to the new study view, passing the full mind map data
        navigate('/study-enhance/mindmaps/session', { state: { mindMapData } });
    };

  // --- 4. RENDER LOGIC ---

  // ✅ ROBUST FALLBACK: If the user lands here directly, guide them back.
  if (!mindMapData || !mindMapData.mindMapData || !mindMapData.mindMapData.root) {
    return (
      <div className="sidebar-page-layout">
        <Sidebar sectionName="Smart Mind Maps" isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} items={sidebarItems} />
        <div className={`sidebar-page-content ${isCollapsed ? "collapsed" : ""}`}>
          <div className="fallback-container">
            <FaBrain className="fallback-icon" />
            <h2 className="fallback-title">No Mind Map Loaded</h2>
            <p className="fallback-text">Please create a new map or select one from your library to view it here.</p>
            <Link to="/study-enhance/mindmaps/all" className="fallback-action-button">
              <FaArrowLeft /> Back to Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div ref={viewRef} className={`mindmap-view ${timeOfDay} ${!isExpanded ? "preview-mode" : ""}`}>
      {!isExpanded && <Sidebar sectionName="Smart Mind Maps" isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} items={sidebarItems} />}
      {isExpanded && (
        <>
          {timeOfDay === "night" && <div id="stars-container"><div id="stars"></div><div id="stars2"></div><div id="stars3"></div></div>}
          {timeOfDay === "morning" && <div id="clouds-container"><div className="cloud cloud-1"></div><div className="cloud cloud-2"></div><div className="cloud cloud-3"></div></div>}
        </>
      )}
      {!isExpanded ? (
        <div className="mindmap-preview-container">
          <div className="mindmap-preview-box">
            <button className="preview-button expand preview-expand-button" onClick={enterFullScreen} title="Enter Fullscreen">
              <FaExpand />
            </button>
            <svg ref={svgRef} className="preview-svg-container"></svg>
            <div className="preview-controls">
               <button className="preview-button review-button" onClick={handleLogReview}>
            <FaHistory /> Mark as Reviewed
        </button>
              <button className="preview-button" onClick={handleSaveImage}><FaSave /> Save as PNG</button>
 </div>
          </div>
        </div>
      ) : (
        <>
          <svg ref={svgRef} className="mindmap-svg-container"></svg>
          <button className="rotate-button fullscreen-exit-button" onClick={exitFullScreen} title="Exit Fullscreen">
            <FaCompress />
          </button>
          <div className="mindmap-controls">
            <button className="rotate-button" onClick={() => setRotation((r) => r - 15)} title="Rotate Left"><FaUndo /></button>
            <span>Rotate</span>
            <button className="rotate-button" onClick={() => setRotation((r) => r + 15)} title="Rotate Right"><FaRedo /></button>
          </div>
          <div className="mindmap-footer">
            <span>Scroll to zoom, Drag to pan, Click nodes to expand/collapse</span>
          </div>
        </>
      )}
    </div>
  );
};

export default MindMapView;