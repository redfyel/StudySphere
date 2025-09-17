import React from "react";
import { FaBook, FaLayerGroup, FaTachometerAlt, FaCog } from "react-icons/fa";

import Sidebar from '../sidebar/Sidebar'
import FlashcardsView from "./FlashCardsView";
import AllCardsView from "./AllCardsView";

const FlashcardsLayout = () => {
  const menuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt className="icon" />,
      component: <div style={{ fontSize: "2em", color: "var(--color-text-light)" }}>Dashboard Coming Soon!</div>
    },
    {
      key: "flashcards",
      label: "Biology Chapter 5",
      icon: <FaBook className="icon" />,
      component: <FlashcardsView />   // ✅ your full flashcards view here
    },
    {
      key: "allCards",
      label: "All Cards (Bio 5)",
      icon: <FaLayerGroup className="icon" />,
      component: <AllCardsView />
    },
    {
      key: "settings",
      label: "Settings",
      icon: <FaCog className="icon" />,
      component: <div style={{ fontSize: "2em", color: "var(--color-text-light)" }}>Settings Coming Soon!</div>
    },
  ];

  return <Sidebar logoText="StudyApp" menuItems={menuItems} />;
};

export default FlashcardsLayout;
