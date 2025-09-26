import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, MessageCircle, Users, Music, FileText, Clock } from "lucide-react";

function AnimatedMenu({ onToggleChat, onToggleParticipants, onToggleMusicPlayer, onToggleNotes, onToggleTimer }) {
  const [open, setOpen] = useState(false);

  const items = [
    { icon: <MessageCircle />, action: onToggleChat, className: "chat-effect" },
    { icon: <Users />, action: onToggleParticipants, className: "participants-effect" },
    { icon: <Music />, action: onToggleMusicPlayer, className: "music-effect" },
    { icon: <FileText />, action: onToggleNotes, className: "notes-effect" },
    { icon: <Clock />, action: onToggleTimer, className: "timer-effect" },
  ];

  return (
    <div className="animated-menu">
      {/* Three Dots Button */}
      <button className="menu-toggle" onClick={() => setOpen(!open)}>
        <MoreVertical size={28} />
      </button>

      {/* Animated Icons */}
      <AnimatePresence>
        {open &&
          items.map((item, i) => (
            <motion.button
              key={i}
              className={`menu-item ${item.className}`}
              onClick={item.action}
              initial={{ scale: 0, opacity: 0, y: 0 }}
              animate={{ scale: 1, opacity: 1, y: -60 - i * 55 }}
              exit={{ scale: 0, opacity: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {item.icon}
            </motion.button>
          ))}
      </AnimatePresence>

      <style jsx>{`
        .animated-menu {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .menu-toggle {
          background: #89A8B2;
          color: white;
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .menu-toggle:hover {
          transform: rotate(90deg) scale(1.1);
        }
        .menu-item {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          background: #222;
          color: white;
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        /* Effects */
        .chat-effect { background: #00b4d8; box-shadow: 0 0 12px #00b4d8; }
        .participants-effect { background: #2ecc71; box-shadow: 0 0 12px #2ecc71; }
        .music-effect { background: #9b59b6; animation: pulse 1.5s infinite; }
        .notes-effect { background: #f39c12; animation: glow 2s infinite alternate; }
        .timer-effect { background: #e74c3c; animation: flicker 1.2s infinite; }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes glow {
          from { box-shadow: 0 0 5px #f39c12; }
          to { box-shadow: 0 0 20px #f1c40f; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default AnimatedMenu;
