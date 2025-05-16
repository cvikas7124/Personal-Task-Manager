import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // For navigation between pages
import { motion } from "framer-motion"; // For smooth animations
import {
  FaRegUser, // User icon
  FaRegCalendarAlt, // Calendar icon
  FaTasks, // Tasks icon
  FaRegClock, // Clock icon
} from "react-icons/fa";
import { MdOutlineSpaceDashboard } from "react-icons/md"; // Dashboard icon
import { TbMatrix } from "react-icons/tb"; // Matrix icon for Eisenhower Matrix

// Sidebar navigation menu for the application
const Sidebar = ({ isDarkMode, toggleDarkMode }) => {
  const location = useLocation(); // Get current URL path
  const navigate = useNavigate(); // For programmatic navigation

  // Get user information from browser storage
  const [username, setUsername] = useState(
    localStorage.getItem("username") || "Guest" // Default to "Guest" if no username found
  );
  const [email, setEmail] = useState(
    localStorage.getItem("email") || "guest@example.com" // Default email
  );

  // Use the received props or fallback to localStorage for dark mode setting
  const actualDarkMode =
    isDarkMode !== undefined
      ? isDarkMode
      : localStorage.getItem("darkMode") === "true";

  // Use the provided toggle function or fallback to local implementation
  const handleToggle =
    toggleDarkMode ||
    (() => {
      // If no toggle function was provided, implement one here
      const newTheme = !actualDarkMode;
      localStorage.setItem("darkMode", newTheme.toString());
      localStorage.setItem("theme", newTheme ? "dark" : "light");

      // Trigger event to notify other components of theme change
      window.dispatchEvent(
        new CustomEvent("themeChanged", {
          detail: { isDarkMode: newTheme },
        })
      );

      // Reload if no toggle function was provided
      window.location.reload();
    });

  // Function to handle user logout
  const handleLogout = () => {
    // Remove authentication and user data
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    navigate("/login"); // Redirect to login page
  };

  // Format username (get first name and capitalize first letter)
  const displayName =
    username.split(" ")[0]?.charAt(0).toUpperCase() +
    username.split(" ")[0]?.slice(1);

  // Navigation menu items with icons and tooltips
  const menuItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <MdOutlineSpaceDashboard size={18} />,
      tooltip: "View your progress overview",
    },
    {
      to: "/daily_planner",
      label: "Daily Planner",
      icon: <FaTasks size={18} />,
      tooltip: "Plan your day efficiently",
    },
    {
      to: "/calendar",
      label: "Calendar",
      icon: <FaRegCalendarAlt size={18} />,
      tooltip: "View upcoming tasks and events",
    },
    {
      to: "/pomodoro_clock",
      label: "Pomodoro Clock",
      icon: <FaRegClock size={18} />,
      tooltip: "Boost focus with Pomodoro method",
    },
    {
      to: "/eisenhower_matrix",
      label: "Eisenhower Matrix",
      icon: <TbMatrix size={18} />,
      tooltip: "Prioritize tasks by importance",
    },
  ];

  // Animation settings for sidebar appearance
  const sidebarVariants = {
    hidden: { x: -250, opacity: 0 }, // Start offscreen to the left
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring", // Bouncy animation
        stiffness: 100,
        damping: 20,
        mass: 0.8,
      },
    },
  };

  // Animation settings for profile section
  const profileVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay: 0.2, duration: 0.5 },
    },
  };

  // Animation settings for menu list container
  const menuVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Delay between each menu item
        delayChildren: 0.3, // Delay before first item appears
      },
    },
  };

  // Animation settings for individual menu items
  const menuItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  // Animation settings for logout button
  const buttonVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { delay: 0.6, duration: 0.5 },
    },
  };

  // Define JADE Global inspired colors for consistent branding
  const jadeBlue = "#1a5188"; // The deep blue from JADE logo
  const jadeGold = "#f9b234"; // The gold/yellow accent in the logo
  const jadeSecondary = "#3a7ab0"; // Lighter blue for accents
  const jadeTeal = "#4DB6AC"; // Teal accent for dark mode

  // Theme colors for dark mode
  const darkTheme = {
    background: `linear-gradient(135deg, #0f2d4a, ${jadeBlue})`,
    text: "#e0e0e0",
    mutedText: "#cccccc",
    accent: jadeGold,
    highlight: jadeTeal,
    logoMain: jadeTeal, // Logo color in dark mode
    logoAccent: jadeGold,
    activeItemBg: jadeGold,
    activeItemText: jadeBlue,
    hoverBg: `${jadeGold}20`, // Semi-transparent gold for hover effect
  };

  // Theme colors for light mode
  const lightTheme = {
    background: `linear-gradient(135deg, #ffffff, ${jadeSecondary}40)`,
    text: "#333333",
    mutedText: "#555555",
    accent: jadeBlue,
    highlight: jadeGold,
    logoMain: jadeBlue, // Logo color in light mode
    logoAccent: jadeGold,
    activeItemBg: jadeBlue,
    activeItemText: "#ffffff",
    hoverBg: `${jadeBlue}10`, // Semi-transparent blue for hover effect
  };

  // Select the active theme based on dark mode setting
  const theme = actualDarkMode ? darkTheme : lightTheme;

  // Track when user hovers over profile section to show email
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  return (
    <motion.div
      className="d-flex flex-column"
      style={{
        width: "250px",
        background: theme.background,
        height: "100vh", // Fixed height to fill the viewport
        color: theme.text,
        boxShadow: "3px 0 10px rgba(0,0,0,0.2)",
        transition: "background 0.3s ease, color 0.3s ease",
        overflow: "hidden", // Prevent overall scrolling
        position: "sticky",
        top: 0,
      }}
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      {/* Top Section (Fixed) */}
      <div className="p-3">
        {/* App Logo */}
        <motion.div
          className="d-flex align-items-center justify-content-between mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Link to="/homepage" style={{ textDecoration: "none" }}>
            <motion.h1
              className="fs-4 fw-bold mb-0"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <span style={{ color: theme.logoMain }}>TickIT</span>
            </motion.h1>
          </Link>

          {/* Theme Toggle Button (Light/Dark) */}
          <motion.button
            className="btn btn-sm"
            onClick={handleToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
              backgroundColor: actualDarkMode ? jadeGold : "#ffffff",
              color: actualDarkMode ? jadeBlue : jadeBlue,
              border: `1px solid ${actualDarkMode ? "transparent" : jadeGold}`,
            }}
          >
            {actualDarkMode ? "🌞" : "🌙"}
          </motion.button>
        </motion.div>

        {/* User Profile Section */}
        <motion.div
          className="d-flex align-items-center mb-4 ps-2"
          variants={profileVariants}
          onMouseEnter={() => setIsProfileHovered(true)}
          onMouseLeave={() => setIsProfileHovered(false)}
          style={{
            position: "relative",
            cursor: "pointer",
          }}
        >
          <motion.div
            className="rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm"
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: actualDarkMode
                ? `${jadeGold}22`
                : `${jadeBlue}15`,
              border: `2px solid ${actualDarkMode ? jadeGold : jadeBlue}`,
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 8px 15px rgba(0,0,0,0.2)",
              backgroundColor: actualDarkMode
                ? `${jadeGold}30`
                : `${jadeBlue}25`,
            }}
            whileTap={{ scale: 0.95 }}
          >
            <FaRegUser
              size={24}
              style={{ color: actualDarkMode ? jadeGold : jadeBlue }}
            />
          </motion.div>

          <motion.h5
            className="ms-3 mb-0 fw-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ color: theme.text }}
          >
            {username}
          </motion.h5>

          {/* Email tooltip - only shown when hovering over profile */}
          {isProfileHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "absolute",
                top: "60px",
                left: "0",
                backgroundColor: actualDarkMode
                  ? `${jadeBlue}CC`
                  : "rgba(255,255,255,0.9)",
                color: theme.text,
                padding: "8px 12px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                fontSize: "0.85rem",
                border: `1px solid ${
                  actualDarkMode ? jadeGold + "30" : jadeBlue + "30"
                }`,
                zIndex: 10,
                width: "100%",
              }}
            >
              <div className="text-center">
                <span style={{ color: theme.mutedText }}>{email}</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Scrollable Middle Section for Navigation Links */}
      <div
        className="sidebar-scroll"
        style={{
          flexGrow: 1,
          overflow: "hidden auto", // Allow vertical scrolling
          paddingLeft: "12px",
          paddingRight: "12px",
          marginBottom: "12px",
          // Custom scrollbar styling for webkit browsers
          scrollbarWidth: "thin",
          scrollbarColor: `${actualDarkMode ? jadeGold : jadeBlue} transparent`,
        }}
      >
        <motion.ul
          className="nav flex-column mb-0 p-0"
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          style={{ listStyle: "none" }}
        >
          {menuItems.map((item, index) => (
            <motion.li
              className="nav-item"
              key={index}
              variants={menuItemVariants}
              style={{ marginBottom: "12px" }}
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={item.to}
                  className="nav-link"
                  title={item.tooltip}
                  style={{
                    borderRadius: "10px",
                    padding: "12px",
                    // Highlight the current page in the navigation
                    backgroundColor:
                      location.pathname === item.to
                        ? theme.activeItemBg
                        : "transparent",
                    color:
                      location.pathname === item.to
                        ? theme.activeItemText
                        : theme.text,
                    transition: "all 0.3s ease",
                    fontWeight: "500",
                    boxShadow:
                      location.pathname === item.to
                        ? "0 4px 8px rgba(0, 0, 0, 0.15)"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    border:
                      location.pathname === item.to
                        ? `1px solid ${actualDarkMode ? jadeGold : jadeBlue}`
                        : "1px solid transparent",
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      backgroundColor:
                        location.pathname === item.to
                          ? actualDarkMode
                            ? jadeBlue
                            : jadeGold
                          : actualDarkMode
                          ? `${jadeGold}30`
                          : `${jadeBlue}20`,
                      color:
                        location.pathname === item.to
                          ? actualDarkMode
                            ? jadeGold
                            : jadeBlue
                          : actualDarkMode
                          ? jadeGold
                          : jadeBlue,
                    }}
                  >
                    {item.icon}
                  </div>
                  {item.label}
                </Link>
              </motion.div>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* Bottom Section with Logout (Fixed) */}
      <div className="p-3 mt-auto">
        {/* Decorative Divider */}
        <motion.div
          className="my-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${jadeGold}, ${jadeBlue}, transparent)`,
          }}
        />

        {/* Logout Button */}
        <motion.div variants={buttonVariants}>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <button
              onClick={handleLogout}
              className="btn w-100"
              style={{
                borderRadius: "30px",
                padding: "12px",
                background: actualDarkMode
                  ? `linear-gradient(45deg, ${jadeBlue}, ${jadeSecondary})`
                  : `linear-gradient(45deg, ${jadeBlue}, ${jadeSecondary})`,
                color: "#FFFFFF",
                transition: "all 0.3s ease",
                fontWeight: "600",
                border: actualDarkMode ? `1px solid ${jadeGold}` : "none",
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Log out from your account"
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
