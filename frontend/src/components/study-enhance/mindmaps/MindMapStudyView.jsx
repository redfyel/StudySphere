import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import axios from 'axios';
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastProvider';
import './MindMapStudyView.css';

// Re-usable D3 text wrapping function
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
const MindMapStudyView = () => {
  const location = useLocation();
  const navigate = useNavigate();
    const { showToast } = useToast();
  const { mindMapData } = location.state || {};
  
  const svgRef = useRef();
  const [branches, setBranches] = useState([]);
  const [currentBranchIndex, setCurrentBranchIndex] = useState(-1); // -1 means only root is shown
  const [timeOfDay, setTimeOfDay] = useState("night");

  // On mount, determine the theme and extract the main branches from the data
  useEffect(() => {
    const currentHour = new Date().getHours();
    setTimeOfDay(currentHour >= 4 && currentHour < 18 ? "morning" : "night");

    if (mindMapData?.mindMapData?.root?.children) {
      setBranches(mindMapData.mindMapData.root.children);
    }
  }, [mindMapData]);

  // The core D3 rendering logic, runs whenever the user reveals a new branch
  useEffect(() => {
    if (!mindMapData?.mindMapData?.root) return;

    // 1. Create a temporary data structure for D3 based on the current progress
    const rootNode = mindMapData.mindMapData.root;
    const revealedBranches = branches.slice(0, currentBranchIndex + 1);
    const dataForD3 = {
      ...rootNode,
      children: revealedBranches,
    };

    // 2. Standard D3 setup
    const width = 1200, height = 800, nodeRadius = 220;
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll("*").remove();
    const svg = svgElement.attr("viewBox", [-width / 2, -height / 2, width, height]);
    const g = svg.append("g").attr("transform", "rotate(-90)"); // Always orient horizontally

    const tree = d3.tree().size([2 * Math.PI, 1]).separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
    const root = d3.hierarchy(dataForD3, (d) => d.children);

    tree(root);
    root.descendants().forEach(d => { d.y = d.depth * nodeRadius; });

    // 3. Render links and nodes (mostly the same as MindMapView, but simplified)
    g.selectAll(".mindmap-link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "mindmap-link")
      .attr("d", d3.linkRadial().angle(d => d.x).radius(d => d.y));

    const node = g.selectAll(".mindmap-node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", "mindmap-node")
      .attr("transform", d => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y}, 0)`);

    node.append("rect");
    node.append("text")
      .attr("class", "mindmap-node-label")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .text(d => d.data.name)
      .call(wrap, 150);

    node.each(function(d) {
        // Sizing and text rotation logic
        const nodeGroup = d3.select(this), textEl = nodeGroup.select("text"), rectEl = nodeGroup.select("rect"), bbox = textEl.node().getBBox(), padding = 10;
        rectEl.attr("class", `level-${d.depth}`).attr("width", bbox.width + padding * 2).attr("height", bbox.height + padding * 2).attr("x", -bbox.width / 2 - padding).attr("y", -bbox.height / 2 - padding);
        const isLeft = d.x > 0 && d.x < Math.PI;
        textEl.attr("transform", `rotate(${isLeft ? 180 : 0})`);
    });

  }, [mindMapData, branches, currentBranchIndex]);

  // Handlers for the study controls
  const handleNext = () => {
    if (currentBranchIndex < branches.length - 1) {
      setCurrentBranchIndex(currentBranchIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentBranchIndex > -1) {
      setCurrentBranchIndex(currentBranchIndex - 1);
    }
  };

  const handleFinishSession = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      await axios.post(`https://studysphere-n4up.onrender.com/api/mindmaps/${mindMapData._id}/sessions`, {}, config);
      showToast("Study session logged!");
    } catch (err) {
      console.error("Failed to log study session", err);
    } finally {
      // Navigate back to the map's detail view after finishing
      navigate('/study-enhance/mindmaps/view', { state: { mindMapData } });
    }
  };
  
  if (!mindMapData) {
    // Fallback if the page is accessed directly
    return <div>Loading study session...</div>;
  }

  return (
    <div className={`mindmap-study-view ${timeOfDay}`}>
      <svg ref={svgRef} className="study-svg-canvas"></svg>
      <div className="study-controls">
        <button onClick={handlePrevious} disabled={currentBranchIndex < 0}>
          <FaArrowLeft /> Previous
        </button>
        <div className="progress-indicator">
            {currentBranchIndex < 0 
                ? "Root Node" 
                : `Branch ${currentBranchIndex + 1} of ${branches.length}`
            }
        </div>
        <button onClick={handleNext} disabled={currentBranchIndex >= branches.length - 1}>
          Next <FaArrowRight />
        </button>
      </div>
      <button className="finish-session-button" onClick={handleFinishSession}>
        <FaCheck /> Finish Session
      </button>
    </div>
  );
};

export default MindMapStudyView;