import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Tooltip.css';

const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="tooltip-box"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            {content}
            <div className="tooltip-arrow" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;