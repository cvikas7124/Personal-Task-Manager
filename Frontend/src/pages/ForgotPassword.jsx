import React, { useState } from "react";
import axios from "axios"; // Library for making HTTP requests to our server
import { useNavigate, Link } from "react-router-dom"; // Tools for navigation between pages
import { motion } from "framer-motion"; // Library for animations

const ForgotPassword = () => {
  // Store the email entered by the user
  const [email, setEmail] = useState("");
  // Store messages to show the user (success or error messages)
  const [message, setMessage] = useState("");
  // Track whether dark mode is on/off (read from saved preferences)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Tool to navigate to other pages programmatically (without clicking links)
  const navigate = useNavigate();

  // Function to switch between dark and light mode
  const handleToggle = () => {
    const newTheme = !isDarkMode; // Flip the current theme
    setIsDarkMode(newTheme); // Update the state
    localStorage.setItem("theme", newTheme ? "dark" : "light"); // Save preference for next visit
  };

  // Function that runs when the send OTP button is clicked
  const handleSendOtp = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!email.trim()) {
      setMessage("❌ Please enter your email address");
      return;
    }

    try {
      // Send the user's email to the server to generate and send an OTP
      const response = await axios.post(
        "http://localhost:8080/forgetPassword/verifyMail",
        { email }, // Send the email data
        {
          headers: {
            "Content-Type": "application/json", // Tell the server we're sending JSON
          },
        }
      );

      // Show success message
      setMessage("✅ OTP sent to your email!");

      // Save email in the browser's storage for use in the next steps of password reset
      localStorage.setItem("userEmail", email);

      // After a short delay, take the user to the OTP verification page
      setTimeout(() => navigate("/verify-otp"), 1500); // 1.5 seconds
    } catch (error) {
      // If something goes wrong, show error message
      console.error(error);
      setMessage(
        `❌ ${
          // Use the server's error message if available, otherwise use a generic message
          error.response?.data || "Something went wrong while sending OTP."
        }`
      );
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
              Forgot Password
            </h2>
            <p className="text-secondary mb-0">
              Enter your email to receive an OTP
            </p>
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
          {/* Email entry form */}
          <motion.form onSubmit={handleSendOtp} variants={containerVariants}>
            <motion.div
              className="mb-4"
              variants={formControlVariants}
              transition={{ delay: 0.1 }} // Slight delay before animating
            >
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`form-control ${
                  isDarkMode ? "bg-dark text-light border-secondary" : ""
                }`}
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Update state when typing
                required
              />
            </motion.div>

            {/* Send OTP button */}
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
              Send OTP
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

export default ForgotPassword;
