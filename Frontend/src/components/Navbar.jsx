import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // For navigation links
import { motion, AnimatePresence } from "framer-motion"; // For smooth animations

// Top navigation bar with user profile and theme toggle
const Navbar = ({ isDarkMode, handleToggle }) => {
  const [username, setUsername] = useState(""); // Store current user's name
  const [dropdownOpen, setDropdownOpen] = useState(false); // Control user menu dropdown
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Check if viewing on mobile device

  useEffect(() => {
    // Load username from local storage when component mounts
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Track window size to adjust for mobile/desktop layouts
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Handle user logout
  const handleLogout = () => {
    // Clear all user data from local storage
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    // Redirect to login page
    window.location.href = "/login";
  };

  // Toggle the user dropdown menu
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Close the dropdown (used when clicking menu items)
  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  return (
    <nav
      className="navbar navbar-expand-lg shadow-sm"
      style={{
        backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff", // Dark/light background
        borderBottom: `1px solid ${isDarkMode ? "#333" : "#ddd"}`, // Dark/light border
        transition: "all 0.3s ease",
        zIndex: 1000, // Ensure navbar stays above other content
      }}
    >
      <div className="container-fluid">
        {/* App Logo and Name */}
        <Link
          className="navbar-brand d-flex align-items-center"
          to="/dashboard"
          style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}
        >
          <img
            src={
              isDarkMode
                ? "/images/tickit-logo-dark.png"
                : "/images/tickit-logo-light.png"
            }
            alt="TickIT Logo"
            height="30"
            className="me-2"
          />
          <span className="fw-bold">TickIT</span>
        </Link>

        {/* Right side elements (theme toggle and user profile) */}
        <div className="ms-auto d-flex align-items-center">
          {/* Theme Toggle Button */}
          <motion.button
            className={`btn btn-sm ${
              isDarkMode ? "btn-outline-light" : "btn-outline-dark"
            } me-3`}
            onClick={handleToggle}
            whileHover={{ scale: 1.05 }} // Grow slightly on hover
            whileTap={{ scale: 0.95 }} // Shrink slightly when clicked
          >
            {isDarkMode ? "🌞" : "🌙"}
          </motion.button>

          {/* User Profile with Dropdown */}
          <div className="position-relative">
            {/* User avatar and name that toggles the dropdown */}
            <motion.div
              className="d-flex align-items-center"
              onClick={toggleDropdown}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ cursor: "pointer" }}
            >
              <div
                className="rounded-circle overflow-hidden me-2 d-flex align-items-center justify-content-center"
                style={{
                  width: "38px",
                  height: "38px",
                  backgroundColor: isDarkMode ? "#4DB6AC22" : "#4A90E222",
                  border: `2px solid ${isDarkMode ? "#4DB6AC" : "#4A90E2"}`,
                }}
              >
                <i
                  className="bi bi-person-fill"
                  style={{
                    color: isDarkMode ? "#4DB6AC" : "#4A90E2",
                    fontSize: "1.2rem",
                  }}
                ></i>
              </div>
              <div style={{ color: isDarkMode ? "#e0e0e0" : "#333" }}>
                <span className="d-none d-md-inline fw-medium">{username}</span>
                <i className="bi bi-chevron-down ms-1 small"></i>
              </div>
            </motion.div>

            {/* User dropdown menu - only shown when dropdown is open */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  className="position-absolute end-0 mt-1 py-2"
                  initial={{ opacity: 0, y: -10 }} // Start invisible and slightly above
                  animate={{ opacity: 1, y: 0 }} // Fade in and move down
                  exit={{ opacity: 0, y: -10 }} // Fade out and move up when closing
                  transition={{ duration: 0.2 }}
                  style={{
                    width: "200px",
                    backgroundColor: isDarkMode ? "#2C2C2C" : "#ffffff",
                    borderRadius: "8px",
                    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                  }}
                >
                  {/* User details section */}
                  <div className="px-3 py-2 border-bottom">
                    <p className="mb-0 fw-bold">{username}</p>
                    <small className="text-muted">
                      {localStorage.getItem("email")}
                    </small>
                  </div>

                  {/* Profile link */}
                  <Link
                    to="/profile"
                    className="dropdown-item py-2 px-3 d-flex align-items-center"
                    onClick={closeDropdown}
                    style={{
                      color: isDarkMode ? "#e0e0e0" : "#333",
                    }}
                  >
                    <i className="bi bi-person me-2"></i> Profile
                  </Link>

                  {/* Settings link */}
                  <Link
                    to="/settings"
                    className="dropdown-item py-2 px-3 d-flex align-items-center"
                    onClick={closeDropdown}
                    style={{
                      color: isDarkMode ? "#e0e0e0" : "#333",
                    }}
                  >
                    <i className="bi bi-gear me-2"></i> Settings
                  </Link>

                  <div className="dropdown-divider"></div>

                  {/* Logout button */}
                  <button
                    className="dropdown-item py-2 px-3 d-flex align-items-center text-danger"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
