import React from 'react';
import './CustomEvent.css'; // We'll create this CSS file next

// A simple mapping for icons, you can expand this with an icon library like react-icons
const ICONS = {
  'Work-Orders': '🔧',
  'Move-Ins': '➡️',
  'Move-Outs': '⬅️',
  'Notes & Reminders': '📝'
};

const CustomEvent = ({ event }) => {
  const { type, title, count, id } = event;

  const eventStyle = {
    backgroundColor: `var(--color-${type.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}-bg)`,
    borderLeft: `3px solid var(--color-${type.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')})`,
  };

  return (
    <div className="custom-event" style={eventStyle}>
      <span className="event-icon">{ICONS[type]}</span>
      <span className="event-title">{id ? `#${id} ${title}` : title}</span>
      {count && <span className="event-count">{count}</span>}
    </div>
  );
};

export default CustomEvent;