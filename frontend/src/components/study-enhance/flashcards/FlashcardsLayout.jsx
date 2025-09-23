import React from "react";
import { useLocation } from "react-router-dom"; // Import useLocation
import { FaBook, FaLayerGroup, FaTachometerAlt, FaCog } from "react-icons/fa";
import { FaFlask, FaLightbulb } from "react-icons/fa";

import FlashcardsView from "./FlashCardsView";
import AllCardsView from "./AllCardsView";

// --- FlashcardsLayout Component ---
const FlashcardsLayout = () => {
  const location = useLocation();
  const { generatedFlashcards } = location.state || {};

  const initialFlashcards = generatedFlashcards || [];

  const menuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <FaLightbulb className="icon" />, // Using FaLightbulb as a placeholder
      component: <div style={{ fontSize: "2em", color: "var(--study-text-light)" }}>Dashboard Coming Soon!</div>
    },
    {
      key: "flashcards",
      label: "Study Deck",
      icon: <FaFlask className="icon" />, // Using FaFlask as a placeholder
      component: <FlashcardsView initialFlashcards={initialFlashcards} />
    },
    {
      key: "allCards",
      label: "All Cards",
      icon: <FaLayerGroup className="icon" />,
      component: <AllCardsView initialFlashcards={initialFlashcards} />
    },
    {
      key: "settings",
      label: "Settings",
      icon: <FaCog className="icon" />, // Assuming FaCog is imported or available
      component: <div style={{ fontSize: "2em", color: "var(--study-text-light)" }}>Settings Coming Soon!</div>
    },
  ];

  return (
    <FlashcardsView initialFlashcards={initialFlashcards} />
  );
};

export default FlashcardsLayout;