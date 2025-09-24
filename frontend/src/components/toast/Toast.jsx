import React, { useEffect , useState} from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { FaAward, FaBell, FaInfoCircle } from "react-icons/fa";
import "./Toast.css";

const toastConfig = {
  praise: {
    icon: <FaAward />,
    className: "praise",
  },
  reminder: {
    icon: <FaBell />,
    className: "reminder",
  },
  info: {
    icon: <FaInfoCircle />,
    className: "info",
  },
};

const Toast = ({ message, type = "info" }) => {
  // State to control the visibility of the toast internally
  const [isVisible, setIsVisible] = useState(true);

  // Function to trigger the closing of the toast
  const handleClose = () => {
    setIsVisible(false);
  };

  // Auto-dismiss the toast after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    // Cleanup the timer if the component unmounts for any reason
    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const { icon, className } = toastConfig[type] || toastConfig.info;

  // We must return the portal and AnimatePresence at the top level.
  // Then, we conditionally render the motion.div *inside* AnimatePresence.
  return ReactDOM.createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`toast-wrapper ${className}`}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          layout
        >
          <div className="toast-icon">{icon}</div>
          <p className="toast-message">{message}</p>
          <button onClick={handleClose} className="toast-close-button">
            <IoClose size={22} />
          </button>

          <motion.div
            className="progress-bar"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
export default Toast;