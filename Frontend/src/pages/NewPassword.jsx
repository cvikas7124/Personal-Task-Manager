import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Tools for navigation between pages
import axios from "axios"; // Library for making HTTP requests to our server
import { motion } from "framer-motion"; // Library for animations

const NewPassword = () => {
  // Store the new password entered by the user
  const [newPassword, setNewPassword] = useState("");
  // Store the confirmed password entered by the user
  const [confirmPassword, setConfirmPassword] = useState("");
  // Store messages to show the user (success or error messages)
  const [message, setMessage] = useState("");
  // Control whether the password field shows the actual text or dots
  const [showPassword, setShowPassword] = useState(false);
  // Control whether the confirm password field shows the actual text or dots
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Track whether dark mode is on/off (read from saved preferences)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  // Tool to navigate to other pages programmatically
  const navigate = useNavigate();
  // Get the user's email from previous steps in password reset flow
  const email = localStorage.getItem("userEmail");

  // Function to switch between dark and light mode
  const handleToggle = () => {
    const newTheme = !isDarkMode; // Flip the current theme
    setIsDarkMode(newTheme); // Update the state
    localStorage.setItem("theme", newTheme ? "dark" : "light"); // Save preference for next visit
  };

  // Function that runs when the reset password form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the form from refreshing the page

    // Check if both password fields match
    if (newPassword !== confirmPassword) {
      return setMessage("❌ Passwords do not match.");
    }

    // Make sure we have the user's email from previous steps
    if (!email) {
      return setMessage("❌ No email found. Please restart the process.");
    }

    try {
      // Send the new password to the server to update the account
      const response = await axios.post(
        "http://localhost:8080/forgetPassword/changePassword",
        { email, newPassword, confirmPassword }, // Send email and both passwords
        {
          headers: {
            "Content-Type": "application/json", // Tell the server we're sending JSON
          },
        }
      );

      // Show success message
      setMessage("✅ Password reset successfully!");

      // Clean up and redirect to login page after a short delay
      setTimeout(() => {
        localStorage.removeItem("userEmail"); // Remove stored email as it's no longer needed
        navigate("/login"); // Take user to login page
      }, 2000); // Wait 2 seconds
    } catch (error) {
      // If something goes wrong, show error message
      console.error(error);
      setMessage(`❌ ${error.response?.data || "Failed to reset password"}`);
    }
  };

  // Animation settings for different elements
  const containerVariants = {
    hidden: { opacity: 0, y: 20 }, // Start invisible and below final position
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }, // Fade in and move up over 0.6 seconds
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }, // Fade out and move up when leaving
    },
  };

  const formControlVariants = {
    hidden: { opacity: 0, y: 10 }, // Start invisible and slightly below
    visible: { opacity: 1, y: 0 }, // Fade in and move to position
  };

  // Function to check password strength and return feedback
  const passwordStrength = (password) => {
    if (!password) return { strength: 0, text: "" }; // If no password, return empty values

    const length = password.length;

    // Simple strength calculation based on password length
    if (length < 6) {
      return { strength: 1, text: "Weak" }; // Short passwords are weak
    } else if (length < 10) {
      return { strength: 2, text: "Medium" }; // Medium-length passwords are adequate
    } else {
      return { strength: 3, text: "Strong" }; // Longer passwords are strong
    }
  };

  // Get password strength information for the current password
  const { strength, text } = passwordStrength(newPassword);

  return (
    // Main background container taking up full height
    <div
      className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-3"
      style={{
        backgroundColor: isDarkMode ? "#121212" : "#f5f5f5", // Dark/light background
        color: isDarkMode ? "#e0e0e0" : "#333", // Dark/light text
        transition: "background-color 0.3s ease, color 0.3s ease", // Smooth transition
      }}
    >
      {/* Theme toggle button in top-right corner */}
      <motion.div
        className="position-absolute top-0 end-0 m-3"
        whileHover={{ scale: 1.1 }} // Grow when hovered
        whileTap={{ scale: 0.9 }} // Shrink when clicked
      >
        <button
          className={`btn btn-sm ${
            isDarkMode ? "btn-outline-light" : "btn-outline-dark"
          }`}
          onClick={handleToggle}
        >
          {isDarkMode ? "🌞" : "🌙"}{" "}
          {/* Sun for light mode, moon for dark mode */}
        </button>
      </motion.div>

      {/* Main card containing the form */}
      <motion.div
        className="card shadow border-0"
        style={{
          width: "100%",
          maxWidth: "400px", // Limit width on larger screens
          borderRadius: "16px", // Rounded corners
          backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff", // Dark/light card background
          color: isDarkMode ? "#e0e0e0" : "#333", // Dark/light card text
          transition: "background-color 0.3s ease, color 0.3s ease", // Smooth transition
        }}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants} // Apply the animations
      >
        <div className="card-body p-4 p-sm-5">
          {" "}
          {/* Extra padding on wider screens */}
          {/* Logo and headings */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} // Start smaller and invisible
            animate={{ scale: 1, opacity: 1 }} // Grow to full size and fade in
            transition={{ duration: 0.5 }}
            className="text-center mb-4"
          >
            <h1
              className="fs-4 fw-bold"
              style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }} // App brand color
            >
              TickIT
            </h1>
            <h2
              className="fs-3 fw-semibold mt-4"
              style={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            >
              Set New Password
            </h2>
            <p className="text-secondary mb-0">Enter a strong new password</p>
          </motion.div>
          {/* Success/Error message display */}
          {message && (
            <motion.div
              className={`alert ${
                message.includes("✅") // Check if this is a success message (has ✅)
                  ? isDarkMode
                    ? "alert-success"
                    : "alert-success"
                  : isDarkMode
                  ? "alert-dark"
                  : "alert-danger"
              } text-center`}
              initial={{ opacity: 0, y: -20 }} // Start invisible and above final position
              animate={{ opacity: 1, y: 0 }} // Fade in and move down
              transition={{ duration: 0.3 }}
            >
              {message}
            </motion.div>
          )}
          {/* New password form */}
          <motion.form onSubmit={handleSubmit} variants={containerVariants}>
            {/* New password field with show/hide toggle */}
            <motion.div
              className="mb-3"
              variants={formControlVariants}
              transition={{ delay: 0.1 }} // Slight delay before animating
            >
              <label className="form-label">New Password</label>
              <div className="input-group mb-1">
                <input
                  type={showPassword ? "text" : "password"} // Toggle between showing and hiding
                  className={`form-control ${
                    isDarkMode ? "bg-dark text-light border-secondary" : ""
                  }`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} // Update state when typing
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  className={`btn ${
                    isDarkMode ? "btn-outline-light" : "btn-outline-secondary"
                  }`}
                  onClick={() => setShowPassword(!showPassword)} // Toggle password visibility
                  tabIndex={-1} // Skip in tab order for better accessibility
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Password strength indicator - shows how strong the password is */}
              {newPassword && (
                <div className="mt-2 mb-3">
                  <div className="d-flex align-items-center">
                    {/* Colored progress bar based on password strength */}
                    <div className="flex-grow-1 me-2">
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className={`progress-bar ${
                            strength === 1
                              ? "bg-danger" // Red for weak passwords
                              : strength === 2
                              ? "bg-warning" // Yellow for medium passwords
                              : "bg-success" // Green for strong passwords
                          }`}
                          style={{ width: `${(strength / 3) * 100}%` }} // Fill based on strength
                        ></div>
                      </div>
                    </div>
                    {/* Text indicator of password strength */}
                    <small
                      style={{
                        color:
                          strength === 1
                            ? "#dc3545" // Red for weak passwords
                            : strength === 2
                            ? "#ffc107" // Yellow for medium passwords
                            : "#28a745", // Green for strong passwords
                      }}
                    >
                      {text} {/* "Weak", "Medium", or "Strong" */}
                    </small>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Confirm password field with show/hide toggle */}
            <motion.div
              className="mb-4"
              variants={formControlVariants}
              transition={{ delay: 0.2 }}
            >
              <label className="form-label">Confirm Password</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"} // Toggle between showing and hiding
                  className={`form-control ${
                    isDarkMode ? "bg-dark text-light border-secondary" : ""
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} // Update state when typing
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className={`btn ${
                    isDarkMode ? "btn-outline-light" : "btn-outline-secondary"
                  }`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle password visibility
                  tabIndex={-1} // Skip in tab order for better accessibility
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {/* Password match indicator - shows if both passwords match */}
              {confirmPassword && (
                <div className="mt-1">
                  {newPassword === confirmPassword ? (
                    <small className="text-success">✓ Passwords match</small>
                  ) : (
                    <small className="text-danger">
                      ✗ Passwords don't match
                    </small>
                  )}
                </div>
              )}
            </motion.div>

            {/* Reset password button */}
            <motion.button
              type="submit"
              className="btn w-100 mb-3"
              style={{
                backgroundColor: isDarkMode ? "#4DB6AC" : "#4A90E2", // Brand color
                borderColor: isDarkMode ? "#4DB6AC" : "#4A90E2",
                color: "#FFFFFF", // Always white text for contrast
              }}
              whileHover={{ scale: 1.03 }} // Slight grow effect on hover
              whileTap={{ scale: 0.98 }} // Slight shrink effect when clicked
              variants={formControlVariants}
              transition={{ delay: 0.3 }}
            >
              Reset Password
            </motion.button>

            {/* Link to login page */}
            <motion.p
              className="text-center mt-4 fw-bold"
              variants={formControlVariants}
              transition={{ delay: 0.4 }}
            >
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-decoration-none"
                style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }} // Brand color
              >
                Sign in
              </Link>
            </motion.p>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};

export default NewPassword;
