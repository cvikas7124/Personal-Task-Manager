import React, { useState, useEffect } from "react";
import axios from "axios"; // Library for making HTTP requests to our server
import { useNavigate, Link } from "react-router-dom"; // Tools for navigation between pages
import { motion } from "framer-motion"; // Library for animations

const RegisterPage = () => {
  // Variables to store user input and app state
  const [username, setUsername] = useState(""); // Store the username entered by user
  const [email, setEmail] = useState(""); // Store the email entered by user
  const [password, setPassword] = useState(""); // Store the password entered by user
  const [confirmPassword, setConfirmPassword] = useState(""); // Store the repeated password for verification
  const [message, setMessage] = useState(""); // Store feedback messages to show the user
  const [showPassword, setShowPassword] = useState(false); // Control whether password is visible or hidden with dots
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Control whether confirm password is visible
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user previously set dark mode and use that preference
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

  // Function that runs when the register form is submitted
  const handleRegister = async (e) => {
    e.preventDefault(); // Stop the form from refreshing the page

    // Check if any field is empty
    if (!username || !email || !password || !confirmPassword) {
      return setMessage("Please fill in all fields.");
    }

    // Make sure both password fields match
    if (password !== confirmPassword) {
      return setMessage("Passwords do not match.");
    }

    try {
      // Send user data to the server to create a new account
      const res = await axios.post("http://localhost:8080/register", {
        username,
        email,
        password,
      });

      console.log(res.data); // Log the server's response for debugging

      // Save email for OTP verification page
      localStorage.setItem("userEmail", email);

      setMessage("✅ OTP has been Send! Please verify your email.");

      // Redirect to OTP verification page after registration
      setTimeout(() => navigate("/verify-registration-otp"), 1000);
    } catch (err) {
      console.error(err.response?.data || err.message); // Log error for debugging

      let errorMessage = "Registration failed. Please try again."; // Default error message

      if (err.response) {
        // If the server sent back specific validation errors
        if (err.response.data) {
          // Format all error messages from server with ❌ icon
          const errorMessages = Object.values(err.response.data).map(
            (message) => `❌ ${message}`
          );
          errorMessage = errorMessages.join("\n"); // Join all errors with line breaks
        }
        // If there's just one general error message
        else if (err.response.data.message) {
          errorMessage = `❌ ${err.response.data.message}`;
        }
      } else {
        // For network errors or other connection problems
        errorMessage = `❌ ${err.message}`;
      }

      setMessage(errorMessage); // Display the error to the user
    }
  };

  // This adds special styling for text placeholders in dark mode
  useEffect(() => {
    // Create a style tag to modify placeholder text color
    const style = document.createElement("style");

    if (isDarkMode) {
      // Make placeholder text visible in dark mode
      style.textContent = `
        .dark-mode-input::placeholder {
          color: rgba(255, 255, 255, 0.6) !important;
          opacity: 1;
        }
      `;
    } else {
      // Use default placeholder styling for light mode
      style.textContent = "";
    }

    document.head.appendChild(style); // Add the style to the page

    // Clean up the added style when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, [isDarkMode]); // Re-run this when dark mode changes

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
    hidden: { opacity: 0, x: -10 }, // Form controls start invisible and to the left
    visible: { opacity: 1, x: 0 }, // Fade in and move to position
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
          maxWidth: "450px", // Limit width on larger screens
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
              Create an account
            </h2>
            <p className="text-secondary fw-bold mb-0">
              Enter your details below
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
          {/* Registration form */}
          <motion.form onSubmit={handleRegister} variants={containerVariants}>
            {/* Username field */}
            <motion.div
              className="mb-3"
              variants={formControlVariants}
              transition={{ delay: 0.1 }} // Slight delay before animating
            >
              <label className="form-label">Username</label>
              <input
                type="text"
                className={`form-control ${
                  isDarkMode
                    ? "bg-dark text-light border-secondary dark-mode-input" // Dark mode styling
                    : ""
                }`}
                value={username}
                onChange={(e) => setUsername(e.target.value)} // Update state when typing
                placeholder="Your username"
                required
              />
            </motion.div>

            {/* Email field */}
            <motion.div
              className="mb-3"
              variants={formControlVariants}
              transition={{ delay: 0.2 }} // Slightly more delay
            >
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${
                  isDarkMode
                    ? "bg-dark text-light border-secondary dark-mode-input"
                    : ""
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Update state when typing
                placeholder="example@gmail.com"
                required
              />
            </motion.div>

            {/* Password field with show/hide toggle */}
            <motion.div
              className="mb-3"
              variants={formControlVariants}
              transition={{ delay: 0.3 }}
            >
              <label className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"} // Toggle between showing and hiding
                  className={`form-control ${
                    isDarkMode
                      ? "bg-dark text-light border-secondary dark-mode-input"
                      : ""
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // Update state when typing
                  placeholder="Enter password"
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
            </motion.div>

            {/* Confirm Password field with show/hide toggle */}
            <motion.div
              className="mb-4"
              variants={formControlVariants}
              transition={{ delay: 0.4 }}
            >
              <label className="form-label">Confirm Password</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"} // Toggle between showing and hiding
                  className={`form-control ${
                    isDarkMode
                      ? "bg-dark text-light border-secondary dark-mode-input"
                      : ""
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} // Update state when typing
                  placeholder="Repeat password"
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
            </motion.div>

            {/* Submit button */}
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
              transition={{ delay: 0.5 }}
            >
              Sign up
            </motion.button>

            {/* Link to login page */}
            <motion.p
              className="text-center mt-4 fw-bold"
              variants={formControlVariants}
              transition={{ delay: 0.6 }}
            >
              Already have an account?{" "}
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

export default RegisterPage;
