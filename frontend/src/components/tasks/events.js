// src/components/tasks/events.js

import { addHours } from "date-fns";

const now = new Date();

export const initialEvents = [
  {
    id: 1,
    title: "Project Alpha Deadline",
    start: addHours(now, 2),
    end: addHours(now, 3),
    color: "#D9A4DE", // Lilac
  },
  {
    id: 2,
    title: "Team Sync Meeting",
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 11, 0),
    color: "#AEC6CF", // Pastel Blue
  },
  {
    id: 3,
    title: "Mid-term Physics Exam",
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 13, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 15, 0),
    color: "#F4989C", // Pastel Red
  },
  {
    id: 4,
    title: "Plan Weekend Trip",
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0),
    color: "#97C1A9", // Pastel Green
  },
  {
    id: 5,
    title: "Yoga Class",
    start:Date(2025,9,30),
    end: Date(2025,9,30),
    color: "#FFD1DC", // Pastel Pink
  }
];