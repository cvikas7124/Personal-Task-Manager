import React from "react";
import { motion } from "framer-motion"; // Library for smooth animations

const HabitProgressBar = ({ completedHabits, totalHabits, isDarkMode }) => {
  // Calculate percentage of completed habits (avoid division by zero)
  const percentage =
    totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
  // Round percentage for display and cap at 100%
  const displayPercentage = Math.min(Math.round(percentage), 100);

  // Get status label based on percentage completion
  const getStatusLabel = () => {
    if (percentage === 0) return "Not Started";
    if (percentage < 30) return "Just Beginning";
    if (percentage < 60) return "Making Progress";
    if (percentage < 100) return "Almost There";
    return "Completed";
  };

  // Get color based on percentage (colors differ in dark/light modes)
  const getColor = () => {
    if (isDarkMode) {
      return percentage < 30
        ? "#ff6b6b" // Red for minimal progress
        : percentage < 60
        ? "#FFB300" // Amber for moderate progress
        : percentage < 100
        ? "#4DB6AC" // Teal for good progress
        : "#4DB6AC"; // Teal for completion
    } else {
      return percentage < 30
        ? "#dc3545" // Bootstrap danger for minimal progress
        : percentage < 60
        ? "#ffc107" // Bootstrap warning for moderate progress
        : percentage < 100
        ? "#17a2b8" // Bootstrap info for good progress
        : "#28a745"; // Bootstrap success for completion
    }
  };

  // Animation variants for the progress bar
  const barVariants = {
    initial: { width: 0 }, // Start with empty bar
    animate: {
      width: `${percentage}%`, // Animate to the calculated percentage
      transition: {
        duration: 1.5, // Animation takes 1.5 seconds
        ease: "easeOut", // Slow down at the end of animation
      },
    },
  };

  // Animation variants for text elements
  const textVariants = {
    initial: { opacity: 0, y: 10 }, // Start invisible and slightly below position
    animate: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.5, duration: 0.5 }, // Start after bar animation begins
    },
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Header with title and status */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <motion.h5
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            color: isDarkMode ? "#4DB6AC" : "#195283", // Teal in dark mode, blue in light
            marginBottom: "0",
            fontWeight: "600",
          }}
        >
          Progress
        </motion.h5>
        <motion.span
          className="badge"
          style={{
            backgroundColor: getColor(), // Dynamic color based on progress
            color: "#fff",
            fontSize: "0.8rem",
            padding: "0.4em 0.8em",
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {getStatusLabel()} {/* Dynamic status text */}
        </motion.span>
      </div>

      {/* Progress bar container */}
      <div
        style={{
          width: "100%",
          background: isDarkMode
            ? "#222" // Dark gray in dark mode
            : "linear-gradient(135deg, #e3e8ee, #f8fafc)", // Subtle gradient in light mode
          borderRadius: "20px",
          height: "24px",
          boxShadow: isDarkMode
            ? "inset 0 2px 6px rgba(0,0,0,0.3)" // Stronger shadow in dark mode
            : "inset 0 2px 6px rgba(0,0,0,0.08)", // Subtle shadow in light mode
          overflow: "hidden",
          position: "relative",
          marginBottom: "0.5rem",
        }}
      >
        {/* Animated progress bar fill */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={barVariants}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${getColor()} 0%, ${getColor()} 100%)`,
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: "10px",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "14px",
            boxShadow:
              percentage > 90
                ? `0px 0px 12px 2px ${
                    isDarkMode
                      ? "rgba(77, 182, 172, 0.7)" // Glowing teal in dark mode
                      : "rgba(25, 82, 131, 0.7)" // Glowing blue in light mode
                  }`
                : "none", // Only add glow when near complete
          }}
        >
          {/* Only show percentage text if bar is wide enough */}
          {displayPercentage > 10 && `${displayPercentage}%`}
        </motion.div>
      </div>

      {/* Progress statistics */}
      <motion.div
        className="d-flex justify-content-between"
        variants={textVariants}
        initial="initial"
        animate="animate"
      >
        {/* Completed tasks count */}
        <div>
          <span
            className="h4 mb-0 me-1"
            style={{
              color: isDarkMode ? "#4DB6AC" : "#195283", // Teal in dark mode, blue in light
              fontWeight: "bold",
            }}
          >
            {completedHabits}
          </span>
          <small style={{ color: isDarkMode ? "#aaa" : "#666" }}>
            completed
          </small>
        </div>
        {/* Total tasks count */}
        <div className="text-end">
          <small style={{ color: isDarkMode ? "#aaa" : "#666" }}>out of</small>
          <span
            className="h6 ms-1"
            style={{
              color: isDarkMode ? "#ccc" : "#555",
            }}
          >
            {totalHabits}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default HabitProgressBar;
