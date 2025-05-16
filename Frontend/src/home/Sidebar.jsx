import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaRegUser,
  FaRegCalendarAlt,
  FaTasks,
  FaRegClock,
} from "react-icons/fa";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { TbMatrix } from "react-icons/tb";

// Update the Sidebar component definition
const Sidebar = ({ isDarkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [username, setUsername] = useState(
    localStorage.getItem("username") || "Guest"
  );
  const [email, setEmail] = useState(
    localStorage.getItem("email") || "guest@example.com"
  );

  // Use the received prop directly instead of maintaining local state
  // If props are not provided, fallback to localStorage
  const actualDarkMode =
    isDarkMode !== undefined
      ? isDarkMode
      : localStorage.getItem("darkMode") === "true";

  // Use the provided toggle function or fallback to local implementation
  const handleToggle =
    toggleDarkMode ||
    (() => {
      const newTheme = !actualDarkMode;
      localStorage.setItem("darkMode", newTheme.toString());
      localStorage.setItem("theme", newTheme ? "dark" : "light");

      // Trigger event
      window.dispatchEvent(
        new CustomEvent("themeChanged", {
          detail: { isDarkMode: newTheme },
        })
      );

      // Reload if no toggle function was provided
      window.location.reload();
    });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    navigate("/login");
  };

  const displayName =
    username.split(" ")[0]?.charAt(0).toUpperCase() +
    username.split(" ")[0]?.slice(1);

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

  // Animation variants
  const sidebarVariants = {
    hidden: { x: -250, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 0.8,
      },
    },
  };

  const profileVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay: 0.2, duration: 0.5 },
    },
  };

  const menuVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const menuItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const buttonVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { delay: 0.6, duration: 0.5 },
    },
  };

  // Define JADE Global inspired colors
  const jadeBlue = "#1a5188"; // The deep blue from JADE logo
  const jadeGold = "#f9b234"; // The gold/yellow accent in the logo
  const jadeSecondary = "#3a7ab0"; // Lighter blue for accents
  const jadeTeal = "#4DB6AC"; // Teal accent for dark mode

  // Updated theme colors
  const darkTheme = {
    background: `linear-gradient(135deg, #0f2d4a, ${jadeBlue})`,
    text: "#e0e0e0",
    mutedText: "#cccccc",
    accent: jadeGold,
    highlight: jadeTeal,
    logoMain: jadeTeal, // New property for logo in dark mode
    logoAccent: jadeGold,
    activeItemBg: jadeGold,
    activeItemText: jadeBlue,
    hoverBg: `${jadeGold}20`,
  };

  const lightTheme = {
    background: `linear-gradient(135deg, #ffffff, ${jadeSecondary}40)`,
    text: "#333333",
    mutedText: "#555555",
    accent: jadeBlue,
    highlight: jadeGold,
    logoMain: jadeBlue, // New property for logo in light mode
    logoAccent: jadeGold,
    activeItemBg: jadeBlue,
    activeItemText: "#ffffff",
    hoverBg: `${jadeBlue}10`,
  };

  // Use actualDarkMode instead of isDarkMode in your component
  const theme = actualDarkMode ? darkTheme : lightTheme;

  // New state for hovering over profile
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  return (
    <motion.div
      className="d-flex flex-column p-3"
      style={{
        width: "250px",
        background: theme.background,
        minHeight: "100vh",
        color: theme.text,
        boxShadow: "3px 0 10px rgba(0,0,0,0.2)",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
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

        {/* Theme Toggle */}
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

      {/* Updated Compact Profile Section */}
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
            backgroundColor: actualDarkMode ? `${jadeGold}22` : `${jadeBlue}15`,
            border: `2px solid ${actualDarkMode ? jadeGold : jadeBlue}`,
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 8px 15px rgba(0,0,0,0.2)",
            backgroundColor: actualDarkMode ? `${jadeGold}30` : `${jadeBlue}25`,
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

        {/* Email tooltip on hover */}
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

      {/* Navigation Links */}
      <motion.ul
        className="nav flex-column mb-auto"
        variants={menuVariants}
        initial="hidden"
        animate="visible"
      >
        {menuItems.map((item, index) => (
          <motion.li
            className="nav-item"
            key={index}
            variants={menuItemVariants}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to={item.to}
                className="nav-link"
                title={item.tooltip}
                style={{
                  marginBottom: "12px",
                  borderRadius: "10px",
                  padding: "12px",
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

      {/* Decorative Element */}
      <motion.div
        className="my-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${jadeGold}, ${jadeBlue}, transparent)`,
        }}
      />

      {/* Logout Button */}
      <motion.div className="mt-auto" variants={buttonVariants}>
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
    </motion.div>
  );
};

export default Sidebar;
