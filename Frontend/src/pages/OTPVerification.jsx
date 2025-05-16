import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom"; // Tools for navigation between pages
import axios from "axios"; // Library for making HTTP requests to our server
import { motion } from "framer-motion"; // Library for animations

const OTPVerification = () => {
  // Store the 6 digits of the OTP code (one digit per array position)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  // Store messages to show the user (success or error messages)
  const [message, setMessage] = useState("");
  // Track whether dark mode is on/off (read from saved preferences)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  // Tool to navigate to other pages programmatically
  const navigate = useNavigate();
  // Get the user's email that was stored when they requested password reset
  const email = localStorage.getItem("userEmail");
  // References to each of the 6 input fields (for focusing them)
  const inputRefs = useRef([]);

  useEffect(() => {
    // When page loads, automatically focus on the first OTP input box
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Function to switch between dark and light mode
  const handleToggle = () => {
    const newTheme = !isDarkMode; // Flip the current theme
    setIsDarkMode(newTheme); // Update the state
    localStorage.setItem("theme", newTheme ? "dark" : "light"); // Save preference for next visit
  };

  // Handle when the user types into an OTP input box
  const handleInput = (index, event) => {
    const value = event.target.value;

    // Only allow digits to be entered (no letters or special characters)
    if (value && !/^\d*$/.test(value)) return;

    // Update the OTP array with the new digit
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1); // Take only the first character if multiple were pasted
    setOtp(newOtp);

    // Automatically move focus to the next input box after typing
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle keyboard navigation between OTP boxes
  const handleKeyDown = (index, event) => {
    // Move focus to previous input when user presses backspace in an empty box
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Function that runs when the verify button is clicked
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the form from refreshing the page
    // Combine all 6 digits into a single string
    const otpValue = otp.join("");

    // Check that all 6 digits were provided
    if (otpValue.length !== 6) {
      setMessage("❌ Please enter all 6 digits of the OTP");
      return;
    }

    try {
      // Send the OTP and email to the server for verification
      const response = await axios.post(
        "http://localhost:8080/forgetPassword/verifyOtp",
        { email, otp: otpValue },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // If verification successful, show success message
      setMessage("✅ OTP verified successfully!");
      // After a short delay, take the user to the new password page
      setTimeout(() => navigate("/new-password"), 1500);
    } catch (error) {
      // If verification fails, show error message
      console.error(error);
      setMessage(`❌ ${"Invalid OTP. Please try again."}`);
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

  // Animation for each OTP input box with staggered timing
  const otpInputVariants = {
    hidden: { opacity: 0, y: 10 }, // Start invisible and slightly below
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1, // Each box appears 0.1 seconds after the previous one
      },
    }),
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
          maxWidth: "420px", // Limit width on larger screens
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
              OTP Verification
            </h2>
            <p className="text-secondary mb-0">
              Enter the OTP sent to <strong>{email}</strong>
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
          {/* OTP verification form */}
          <motion.form
            onSubmit={handleSubmit}
            variants={containerVariants}
            className="mt-4"
          >
            <div className="mb-4">
              <label className="form-label mb-3 text-center d-block">
                Enter 6-Digit OTP Code
              </label>
              {/* Container for the 6 OTP input boxes */}
              <div className="d-flex justify-content-center gap-2">
                {/* Create 6 individual digit input boxes */}
                {otp.map((digit, index) => (
                  <motion.input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)} // Store reference to focus the input
                    type="text"
                    className={`form-control text-center ${
                      isDarkMode ? "bg-dark text-light border-secondary" : ""
                    }`}
                    style={{
                      width: "40px", // Small square for each digit
                      height: "50px",
                      fontSize: "1.2rem",
                      fontWeight: "bold", // Make digits easy to read
                    }}
                    value={digit}
                    onChange={(e) => handleInput(index, e)} // Update when user types
                    onKeyDown={(e) => handleKeyDown(index, e)} // Handle keyboard navigation
                    maxLength="1" // Allow only one character per box
                    custom={index} // Pass index for staggered animation
                    variants={otpInputVariants} // Apply animations
                    initial="hidden"
                    animate="visible"
                  />
                ))}
              </div>
            </div>

            {/* Verify button */}
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
              Verify OTP
            </motion.button>

            {/* Resend OTP option */}
            <motion.div
              className="text-center mt-4 fw-bold"
              variants={formControlVariants}
              transition={{ delay: 0.4 }}
            >
              <p className="small mb-2">Didn't receive the OTP?</p>
              <Link
                to="/forgot-password"
                className="btn btn-sm btn-link text-decoration-none"
                style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }} // Brand color
              >
                Resend OTP
              </Link>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPVerification;
