import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion"; // Import framer-motion

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const navigate = useNavigate();

  const handleToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:8080/login", {
        username,
        password,
      });

      const userData = res.data;

      // Make sure we're using the correct property for the token
      localStorage.setItem("token", userData.accessToken);
      localStorage.setItem("username", userData.username);
      localStorage.setItem("email", userData.email);

      navigate("/homepage");
    } catch (err) {
      console.error(err.response?.data || err.message);
      setMessage("Login failed. Please check your credentials.");
    }
  };

  // Add a style element for placeholder colors in dark mode
  useEffect(() => {
    const style = document.createElement("style");

    if (isDarkMode) {
      style.textContent = `
        .dark-mode-input::placeholder {
          color: rgba(255, 255, 255, 0.6) !important;
          opacity: 1;
        }
      `;
    } else {
      style.textContent = "";
    }

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [isDarkMode]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 },
    },
  };

  const formControlVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-3"
      style={{
        backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
        color: isDarkMode ? "#e0e0e0" : "#333",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      <motion.div
        className="position-absolute top-0 end-0 m-3"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <button
          className={`btn btn-sm ${
            isDarkMode ? "btn-outline-light" : "btn-outline-dark"
          }`}
          onClick={handleToggle}
        >
          {isDarkMode ? "🌞" : "🌙"}
        </button>
      </motion.div>

      <motion.div
        className="card shadow border-0"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "16px",
          backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff",
          color: isDarkMode ? "#e0e0e0" : "#333",
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
      >
        <div className="card-body p-4 p-sm-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-4"
          >
            <h1
              className="fs-4 fw-bold"
              style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}
            >
              TickIT
            </h1>
            <h2
              className="fs-3 fw-semibold mt-4"
              style={{ color: isDarkMode ? "#ffffff" : "#000000" }}
            >
              Welcome back
            </h2>
            <p className="text-secondary fw-bold mb-0">
              Please enter your details
            </p>
          </motion.div>

          {message && (
            <motion.div
              className={`alert ${
                isDarkMode ? "alert-dark" : "alert-danger"
              } text-center`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {message}
            </motion.div>
          )}

          <motion.form onSubmit={handleSubmit} variants={containerVariants}>
            <motion.div
              className="mb-3"
              variants={formControlVariants}
              transition={{ delay: 0.1 }}
            >
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                className={`form-control ${
                  isDarkMode
                    ? "bg-dark text-light border-secondary dark-mode-input"
                    : ""
                }`}
                placeholder="Enter your username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </motion.div>

            <motion.div
              className="mb-3"
              variants={formControlVariants}
              transition={{ delay: 0.2 }}
            >
              <label className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`form-control ${
                    isDarkMode
                      ? "bg-dark text-light border-secondary dark-mode-input"
                      : ""
                  }`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={`btn ${
                    isDarkMode ? "btn-outline-light" : "btn-outline-secondary"
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </motion.div>

            <motion.div
              className="d-flex justify-content-end mb-3"
              variants={formControlVariants}
              transition={{ delay: 0.3 }}
            >
              <Link
                to="/forgot-password"
                className="text-decoration-none small"
                style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}
              >
                Forgot password?
              </Link>
            </motion.div>

            <motion.button
              type="submit"
              className="btn w-100 mb-3"
              style={{
                backgroundColor: isDarkMode ? "#4DB6AC" : "#4A90E2",
                borderColor: isDarkMode ? "#4DB6AC" : "#4A90E2",
                color: "#FFFFFF", // Always white text for better contrast
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              variants={formControlVariants}
              transition={{ delay: 0.4 }}
            >
              Sign in
            </motion.button>

            <motion.p
              className="text-center mt-4 fw-bold"
              variants={formControlVariants}
              transition={{ delay: 0.5 }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-decoration-none"
                style={{ color: isDarkMode ? "#4DB6AC" : "#4A90E2" }}
              >
                Sign up
              </Link>
            </motion.p>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
