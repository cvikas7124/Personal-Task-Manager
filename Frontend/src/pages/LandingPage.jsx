import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import TypingEffect from "../components/TypingEffect"; // Updated import path
import { motion } from "framer-motion"; // This package is used for smooth animations
// These are icons we'll use throughout the page
import { BsListTask, BsCalendarDate } from "react-icons/bs";
import { FaHourglassEnd, FaRegUserCircle } from "react-icons/fa";
import { BiCategory } from "react-icons/bi";

const LandingPage = () => {
  // Store whether dark mode is on/off
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Track when user scrolls down to features section
  const [isVisible, setIsVisible] = useState(false);
  // Reference to the features section element
  const featuresRef = useRef(null);

  useEffect(() => {
    // When page loads, check if user previously set dark mode
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }

    // This watches when user scrolls to the features section
    // to trigger animations when that section comes into view
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the section is visible
    );

    // Start observing the features section
    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    // Clean up the observer when the component unmounts
    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, []);

  // Function to toggle between light and dark mode
  const handleToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light"); // Remember user's preference
  };

  // Animation settings for the features section
  const containerVariants = {
    hidden: { opacity: 0 }, // Start invisible
    visible: {
      opacity: 1, // Fade in
      transition: {
        delayChildren: 0.3, // Wait before animating children
        staggerChildren: 0.2, // Animate children one after another
      },
    },
  };

  // Animation for each individual feature card
  const itemVariants = {
    hidden: { y: 20, opacity: 0 }, // Start below final position and invisible
    visible: { y: 0, opacity: 1 }, // Move up and fade in
  };

  return (
    // Main container for the entire page
    <div
      className={`min-vh-100 d-flex flex-column font-sans ${
        isDarkMode ? "dark-mode" : "light-mode"
      }`}
      style={{
        backgroundColor: isDarkMode ? "#121212" : "#f9f9f9", // Dark/light background
        color: isDarkMode ? "#e0e0e0" : "#333", // Dark/light text color
        transition: "background-color 0.3s ease, color 0.3s ease", // Smooth transition when switching modes
      }}
    >
      {/* Top navigation bar */}
      <nav
        className={`navbar ${
          isDarkMode ? "navbar-dark" : "navbar-light"
        } shadow-sm px-4 py-2 sticky-top`}
        style={{
          backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff",
          borderBottom: `1px solid ${isDarkMode ? "#333" : "#ddd"}`,
          transition: "background-color 0.3s ease, border-color 0.3s ease",
        }}
      >
        <div className="container-fluid d-flex justify-content-between align-items-center">
          {/* App logo/name with entrance animation */}
          <motion.h1
            className="fs-4 fw-bold mb-0"
            initial={{ scale: 0.9, opacity: 0 }} // Start slightly smaller and invisible
            animate={{ scale: 1, opacity: 1 }} // Grow to full size and fade in
            transition={{ duration: 0.5 }}
          >
            <span style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}>
              TickIT
            </span>
          </motion.h1>
          <div className="d-flex flex-wrap justify-content-end align-items-center">
            {/* Dark/light mode toggle button */}
            <motion.button
              className={`btn btn-sm ${
                isDarkMode ? "btn-outline-light" : "btn-outline-secondary"
              } me-md-3 me-2 mb-2 mb-md-0`}
              onClick={handleToggle}
              whileHover={{ scale: 1.05 }} // Grow slightly when hovered
              whileTap={{ scale: 0.95 }} // Shrink slightly when clicked
            >
              {isDarkMode ? "🌞" : "🌙"}
              <span className="d-none d-sm-inline ms-2">
                {isDarkMode ? "Light" : "Dark"}
              </span>
            </motion.button>

            {/* Login and Register buttons */}
            <motion.div className="d-flex flex-wrap">
              <Link
                to="/login"
                className={`btn me-2 mb-2 mb-md-0 ${
                  isDarkMode ? "btn-outline-light" : ""
                }`}
                style={{
                  borderColor: isDarkMode ? "#4DB6AC" : "#4A90E2",
                  color: isDarkMode ? "#4DB6AC" : "#4A90E2",
                  transition: "all 0.3s ease",
                }}
              >
                Login
              </Link>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register"
                  className="btn"
                  style={{
                    backgroundColor: isDarkMode ? "#4DB6AC" : "#4A90E2",
                    borderColor: isDarkMode ? "#4DB6AC" : "#4A90E2",
                    color: isDarkMode ? "#000000" : "#ffffff",
                    transition: "all 0.3s ease",
                  }}
                >
                  Register
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section - The main introductory area */}
      <motion.div
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-center py-5"
        style={{
          backgroundColor: isDarkMode ? "#121212" : "#f9f9f9",
          transition: "background-color 0.3s ease",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 text-center text-lg-start mb-4 mb-lg-0">
              {/* Main headline with animation */}
              <motion.h2
                className="fw-bold display-5 mb-3"
                initial={{ x: -50, opacity: 0 }} // Start from left side and invisible
                animate={{ x: 0, opacity: 1 }} // Move to position and fade in
                transition={{ duration: 0.5 }}
              >
                Organize Your Day with{" "}
                <span style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}>
                  TickIT
                </span>
              </motion.h2>

              {/* Typing effect that shows multiple phrases in sequence */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <TypingEffect />
              </motion.div>

              {/* App description */}
              <motion.p
                className="mb-4 fs-5"
                style={{
                  color: isDarkMode ? "#B0BEC5" : "#666",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                A sleek, simple, and powerful To-Do list web app to manage your
                tasks, set reminders, and stay productive!
              </motion.p>

              {/* Call to action button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ y: 30, opacity: 0 }} // Start below and invisible
                animate={{ y: 0, opacity: 1 }} // Move up and fade in
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Link
                  to="/register"
                  className="btn px-4 py-2 btn-lg"
                  style={{
                    backgroundColor: isDarkMode ? "#4DB6AC" : "#4A90E2",
                    borderColor: isDarkMode ? "#4DB6AC" : "#4A90E2",
                    color: isDarkMode ? "#000000" : "#ffffff",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                  }}
                >
                  Get Started Now <i className="bi bi-arrow-right ms-2"></i>
                </Link>
              </motion.div>
            </div>
            {/* Hero image (only shows on larger screens) */}
            <div className="col-lg-6 d-none d-lg-block">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7 }}
                className="text-center"
              >
                <img
                  src="/images/task-management.svg"
                  alt="Task Management"
                  className="img-fluid"
                  style={{ maxWidth: "80%" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features Section - Shows the app's key features */}
      <motion.div
        className="py-5"
        style={{
          backgroundColor: isDarkMode ? "#1A1A1A" : "#f0f4f8",
          transition: "background-color 0.3s ease",
        }}
        ref={featuresRef} // Reference for scroll detection
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"} // Only animate when scrolled into view
      >
        <div className="container">
          <motion.h3
            className="text-center mb-5 fw-bold"
            variants={itemVariants}
          >
            <span style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}>
              Features
            </span>{" "}
            That Make Life Easy
          </motion.h3>

          {/* Feature cards in a row */}
          <div className="row g-4">
            {/* Map through feature data to generate cards */}
            {[
              {
                icon: <BsListTask size={24} />,
                title: "Task Management",
                desc: "Add, edit, and delete tasks effortlessly with intuitive controls",
              },
              {
                icon: <BsCalendarDate size={24} />,
                title: "Date & Priority",
                desc: "Organize tasks by date and priority to focus on what matters most",
              },
              {
                icon: <FaHourglassEnd size={24} />,
                title: "Smart Reminders",
                desc: "Get timely notifications so you never miss an important task",
              },
              {
                icon: <BiCategory size={24} />,
                title: "Categories",
                desc: "Categorize your lists like a pro to keep everything organized",
              },
            ].map((feature, index) => (
              <motion.div
                className="col-md-6 col-lg-3"
                key={index}
                variants={itemVariants}
              >
                <motion.div
                  className="card h-100 border-0 shadow-sm"
                  whileHover={{
                    y: -10, // Lift card up when hovered
                    boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
                  }}
                  style={{
                    backgroundColor: isDarkMode ? "#2C2C2C" : "#ffffff",
                    color: isDarkMode ? "#e0e0e0" : "#333",
                    transition: "all 0.3s ease",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div className="card-body text-center p-4">
                    <div
                      className="feature-icon mb-3 mx-auto d-flex align-items-center justify-content-center"
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: isDarkMode ? "#4DB6AC20" : "#4A90E220",
                        color: isDarkMode ? "#4DB6AC" : "#4A90E2",
                      }}
                    >
                      {feature.icon}
                    </div>
                    <h5 className="card-title">{feature.title}</h5>
                    <p
                      className="card-text"
                      style={{ color: isDarkMode ? "#B0BEC5" : "#666" }}
                    >
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Testimonial Section - Shows user reviews */}
      <motion.div
        className="py-5"
        style={{
          backgroundColor: isDarkMode ? "#121212" : "#ffffff",
          transition: "background-color 0.3s ease",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="container">
          <h3 className="text-center mb-5 fw-bold">
            What Our{" "}
            <span style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}>
              Users
            </span>{" "}
            Say
          </h3>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Single testimonial card */}
              <motion.div
                className="text-center p-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                style={{
                  borderRadius: "12px",
                  backgroundColor: isDarkMode ? "#1E1E1E" : "#f9f9f9",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                }}
              >
                {/* 5-star rating */}
                <div className="mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className="bi bi-star-fill me-1"
                      style={{ color: "#FFD700" }}
                    ></i>
                  ))}
                </div>
                {/* Testimonial text */}
                <p
                  className="fs-5 fst-italic"
                  style={{ color: isDarkMode ? "#B0BEC5" : "#666" }}
                >
                  "TickIT has completely transformed how I manage my daily
                  tasks. The intuitive interface and smart reminders ensure I
                  never miss a deadline!"
                </p>
                {/* User info */}
                <div className="d-flex align-items-center justify-content-center mt-3">
                  <div
                    className="rounded-circle overflow-hidden me-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "50px",
                      height: "50px",
                      backgroundColor: isDarkMode ? "#2C2C2C" : "#eaeaea",
                      color: isDarkMode ? "#4DB6AC" : "#4A90E2",
                    }}
                  >
                    <FaRegUserCircle size={30} />
                  </div>
                  <div className="text-start">
                    <h6 className="mb-0 fw-bold">Vikas Chauhan</h6>
                    <small
                      style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}
                    >
                      Intern
                    </small>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Call-to-Action Section - Final push to register */}
      <motion.div
        className="py-5"
        style={{
          backgroundImage: `linear-gradient(${
            isDarkMode ? "135deg, #1A1A1A, #2C2C2C" : "135deg, #4A90E2, #63B3ED"
          })`,
          transition: "background-image 0.3s ease",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container text-center">
          <h3
            className="fw-bold mb-3 display-6"
            style={{ color: isDarkMode ? "#FFFFFF" : "#FFFFFF" }}
          >
            Transform Your Productivity Today
          </h3>
          <p
            className="mb-4 fs-5 mx-auto"
            style={{
              color: isDarkMode ? "#E0E0E0" : "#FFFFFF",
              maxWidth: "700px",
              opacity: 0.9,
            }}
          >
            Join thousands of professionals who have streamlined their workflow
            and achieved more with TickIT's powerful task management system.
          </p>
          {/* Final call-to-action button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/register"
              className="btn btn-lg px-5 py-3"
              style={{
                backgroundColor: isDarkMode ? "#FFFFFF" : "#FFFFFF",
                color: isDarkMode ? "#121212" : "#4A90E2",
                fontWeight: "600",
                borderRadius: "30px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
              }}
            >
              Begin your journey with TickIT
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer - Site information and links */}
      <footer
        className="py-4"
        style={{
          backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff",
          color: isDarkMode ? "#B0BEC5" : "#666",
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            {/* App name and tagline */}
            <div className="col-md-4 text-center text-md-start mb-3 mb-md-0">
              <h5 style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}>
                TickIT
              </h5>
              <p className="small mb-0">
                Simplifying task management since 2025
              </p>
            </div>
            {/* Social media icons */}
            <div className="col-md-4 text-center mb-3 mb-md-0">
              <div className="d-flex justify-content-center gap-3">
                <a
                  href="#"
                  className="text-decoration-none"
                  style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}
                >
                  <i className="bi bi-facebook fs-5"></i>
                </a>
                <a
                  href="#"
                  className="text-decoration-none"
                  style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}
                >
                  <i className="bi bi-twitter fs-5"></i>
                </a>
                <a
                  href="#"
                  className="text-decoration-none"
                  style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}
                >
                  <i className="bi bi-instagram fs-5"></i>
                </a>
              </div>
            </div>
            {/* Copyright information */}
            <div className="col-md-4 text-center text-md-end">
              <p className="mb-0 small">
                © 2025 TickIT. All rights reserved. |{" "}
                {/* Privacy and Terms links commented out */}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
