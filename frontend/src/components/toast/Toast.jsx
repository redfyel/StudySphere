import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { IoClose } from "react-icons/io5";
import "./Toast.css"; 

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 9000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return ReactDOM.createPortal(
    <motion.div
      className={`toast-container ${type}`}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      transition={{ type: "spring", stiffness: 150 }}
    >
      <span className="toast-message">{message}</span>
      <button className="close-btn" onClick={onClose}>
        <IoClose />
      </button>
    </motion.div>,
    document.body
  );
};

export default Toast;