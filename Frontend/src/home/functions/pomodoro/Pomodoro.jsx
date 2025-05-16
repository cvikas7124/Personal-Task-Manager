import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Sidebar from "../../../components/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "./Pomodoro.css";

const Pomodoro = () => {
  // Timer settings with configurable durations
  const DEFAULT_SETTINGS = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    longBreakInterval: 4,
  };

  // State management
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("pomodoroSettings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [time, setTime] = useState(settings.pomodoro);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("pomodoro");
  const [showSettings, setShowSettings] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add theme state and constants - Match the HomePage theme system
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  // Theme color palettes - Same as HomePage
  const theme = {
    light: {
      background: "#F9FAFB",
      cardBg: "#FFFFFF",
      text: "#333333",
      mutedText: "#6c757d",
      border: "#e0e0e0",
      primary: "#4A6FA5", // Slate Blue
      secondary: "#B0BEC5", // Warm Gray
      success: "#4DB6AC", // Light Teal
      danger: "#FF6B6B", // Bright Coral
      warning: "#FFD54F", // Muted Gold
      info: "#2979FF", // Electric Blue
      accent: "#7E57C2", // Accent Purple
      headerBg: "#FFFFFF",
    },
    dark: {
      background: "#263238", // Soft Charcoal
      cardBg: "#37474F", // Darker shade of Soft Charcoal
      text: "#E0E0E0", // Cool Gray
      mutedText: "#B0BEC5", // Warm Gray
      border: "#455A64", // Bluish gray
      primary: "#4A6FA5", // Slate Blue
      secondary: "#607D8B", // Bluish gray
      success: "#4DB6AC", // Light Teal
      danger: "#FF6B6B", // Bright Coral
      warning: "#FFD54F", // Muted Gold
      info: "#2979FF", // Electric Blue
      accent: "#7E57C2", // Accent Purple
      headerBg: "#1E272C", // Darker than background
    },
  };

  // Current theme based on mode
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());

    // Dispatch theme change event for other components
    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: { isDarkMode: newMode },
      })
    );
  };

  // Effect to sync dark mode with system preference or localStorage
  useEffect(() => {
    const darkModeFromStorage = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeFromStorage);
  }, []);

  // Add this effect to listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (event) => {
      const { isDarkMode: newDarkMode } = event.detail;
      setIsDarkMode(newDarkMode);
    };

    // Add event listener for theme changes
    window.addEventListener("themeChanged", handleThemeChange);

    // Cleanup
    return () => {
      window.removeEventListener("themeChanged", handleThemeChange);
    };
  }, []);

  const audioRef = useRef(null);

  // Timer mode colors (with theme-aware variants)
  const getModeColors = (currentMode) => {
    if (isDarkMode) {
      return {
        pomodoro: {
          primary: "#FF7E6B",
          secondary: "#FF9B8C",
          bg: "rgba(255, 126, 107, 0.15)",
          border: "rgba(255, 126, 107, 0.3)",
        },
        shortBreak: {
          primary: "#7FB3D5",
          secondary: "#A3CCE9",
          bg: "rgba(127, 179, 213, 0.15)",
          border: "rgba(127, 179, 213, 0.3)",
        },
        longBreak: {
          primary: "#9B8CD9",
          secondary: "#B5A8E3",
          bg: "rgba(155, 140, 217, 0.15)",
          border: "rgba(155, 140, 217, 0.3)",
        },
      }[currentMode];
    } else {
      return {
        pomodoro: {
          primary: "#FF7E6B",
          secondary: "#FF9B8C",
          bg: "rgba(255, 126, 107, 0.05)",
          border: "rgba(255, 126, 107, 0.2)",
        },
        shortBreak: {
          primary: "#7FB3D5",
          secondary: "#A3CCE9",
          bg: "rgba(127, 179, 213, 0.05)",
          border: "rgba(127, 179, 213, 0.2)",
        },
        longBreak: {
          primary: "#9B8CD9",
          secondary: "#B5A8E3",
          bg: "rgba(155, 140, 217, 0.05)",
          border: "rgba(155, 140, 217, 0.2)",
        },
      }[currentMode];
    }
  };

  const currentModeColors = getModeColors(mode);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
  }, [settings]);

  // Timer logic
  useEffect(() => {
    let interval;

    if (running) {
      interval = setInterval(() => {
        setTime((prev) => {
          if (prev > 0) return prev - 1;
          else {
            // Play notification sound
            if (audioRef.current) {
              audioRef.current.play();
            }

            // Handle timer completion
            if (mode === "pomodoro") {
              // Increment completed pomodoros
              const newCompleted = completedPomodoros + 1;
              setCompletedPomodoros(newCompleted);

              // Check if it's time for a long break
              if (newCompleted % settings.longBreakInterval === 0) {
                setMode("longBreak");
                toast.success("Great job! Take a longer break.");
                return settings.longBreak;
              } else {
                setMode("shortBreak");
                toast.info("Time for a short break!");
                return settings.shortBreak;
              }
            } else {
              // End of break, back to pomodoro
              setMode("pomodoro");
              toast.info("Break's over. Time to focus!");
              return settings.pomodoro;
            }
          }
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [running, mode, completedPomodoros, settings]);

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Progress calculation
  const calculateProgress = () => {
    const total =
      mode === "pomodoro"
        ? settings.pomodoro
        : mode === "shortBreak"
        ? settings.shortBreak
        : settings.longBreak;
    return ((total - time) / total) * 100;
  };

  // Handle switching timer modes
  const switchMode = (newMode) => {
    setRunning(false);
    setMode(newMode);
    setTime(
      newMode === "pomodoro"
        ? settings.pomodoro
        : newMode === "shortBreak"
        ? settings.shortBreak
        : settings.longBreak
    );
  };

  // Reset timer
  const handleReset = () => {
    setRunning(false);
    setTime(
      mode === "pomodoro"
        ? settings.pomodoro
        : mode === "shortBreak"
        ? settings.shortBreak
        : settings.longBreak
    );
  };

  // Save settings changes
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    setTime(
      mode === "pomodoro"
        ? newSettings.pomodoro
        : mode === "shortBreak"
        ? newSettings.shortBreak
        : newSettings.longBreak
    );
    setShowSettings(false);
  };

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);
      try {
        const response = await axios.get("http://localhost:8080/getTask", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Filter for active tasks (not completed)
        const incompleteTasks = response.data.filter(
          (task) => task.status !== "Completed"
        );

        setTasks(incompleteTasks);

        // If there was a previously selected task in localStorage, restore it
        const savedTaskId = localStorage.getItem("pomodoroCurrentTaskId");
        if (savedTaskId) {
          const savedTask = incompleteTasks.find(
            (task) => task.id === parseInt(savedTaskId)
          );
          if (savedTask) {
            setCurrentTask(savedTask);
          }
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Could not load your tasks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Add this effect to save the current task ID to localStorage when it changes
  useEffect(() => {
    if (currentTask) {
      localStorage.setItem("pomodoroCurrentTaskId", currentTask.id);
    } else {
      localStorage.removeItem("pomodoroCurrentTaskId");
    }
  }, [currentTask]);

  // Settings component
  const SettingsModal = () => {
    const [localSettings, setLocalSettings] = useState({ ...settings });

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setLocalSettings({
        ...localSettings,
        [name]: parseInt(value) * 60, // Convert minutes to seconds
      });
    };

    return (
      <motion.div
        className="settings-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="settings-modal card shadow"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ backgroundColor: currentTheme.cardBg }}
        >
          <div
            className="card-header py-3"
            style={{
              backgroundColor: isDarkMode
                ? currentTheme.headerBg
                : currentTheme.cardBg,
              borderBottom: `1px solid ${currentTheme.border}`,
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0" style={{ color: currentTheme.text }}>
                <i className="bi bi-gear me-2"></i> Timer Settings
              </h5>
              <button
                className={`btn-close ${isDarkMode ? "inverted-close" : ""}`}
                onClick={() => setShowSettings(false)}
              ></button>
            </div>
          </div>

          <div className="card-body settings-content">
            <div className="setting-item mb-3">
              <label
                className="form-label"
                style={{ color: currentTheme.text }}
              >
                Pomodoro (minutes)
              </label>
              <input
                type="number"
                className="form-control settings-input"
                name="pomodoro"
                min="1"
                max="60"
                value={localSettings.pomodoro / 60}
                onChange={handleInputChange}
                style={{
                  backgroundColor: isDarkMode
                    ? currentTheme.background
                    : "#FFFFFF",
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                }}
              />
            </div>

            <div className="setting-item mb-3">
              <label
                className="form-label"
                style={{ color: currentTheme.text }}
              >
                Short Break (minutes)
              </label>
              <input
                type="number"
                className="form-control settings-input"
                name="shortBreak"
                min="1"
                max="30"
                value={localSettings.shortBreak / 60}
                onChange={handleInputChange}
                style={{
                  backgroundColor: isDarkMode
                    ? currentTheme.background
                    : "#FFFFFF",
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                }}
              />
            </div>

            <div className="setting-item mb-3">
              <label
                className="form-label"
                style={{ color: currentTheme.text }}
              >
                Long Break (minutes)
              </label>
              <input
                type="number"
                className="form-control settings-input"
                name="longBreak"
                min="5"
                max="60"
                value={localSettings.longBreak / 60}
                onChange={handleInputChange}
                style={{
                  backgroundColor: isDarkMode
                    ? currentTheme.background
                    : "#FFFFFF",
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                }}
              />
            </div>

            <div className="setting-item mb-3">
              <label
                className="form-label"
                style={{ color: currentTheme.text }}
              >
                Long Break Interval
              </label>
              <input
                type="number"
                className="form-control settings-input"
                name="longBreakInterval"
                min="1"
                max="10"
                value={localSettings.longBreakInterval}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    longBreakInterval: parseInt(e.target.value),
                  })
                }
                style={{
                  backgroundColor: isDarkMode
                    ? currentTheme.background
                    : "#FFFFFF",
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                }}
              />
            </div>
          </div>

          <div
            className="card-footer border-top py-3"
            style={{
              backgroundColor: isDarkMode
                ? currentTheme.headerBg
                : currentTheme.cardBg,
              borderTop: `1px solid ${currentTheme.border}`,
            }}
          >
            <div className="d-flex justify-content-end">
              <button
                className="btn me-2"
                onClick={() => setShowSettings(false)}
                style={{
                  backgroundColor: "transparent",
                  color: currentTheme.secondary,
                  borderColor: currentTheme.secondary,
                }}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => saveSettings(localSettings)}
                style={{
                  backgroundColor: currentTheme.primary,
                  color: "#FFFFFF",
                  border: "none",
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Task selection component
  const TaskSelector = () => {
    return (
      <div className="card shadow-sm mb-3 task-selector">
        <div
          className="card-header py-2"
          style={{
            backgroundColor: isDarkMode
              ? currentTheme.headerBg
              : currentTheme.cardBg,
            borderBottom: `1px solid ${currentTheme.border}`,
          }}
        >
          <h5 className="mb-0" style={{ color: currentTheme.text }}>
            <i className="bi bi-list-task me-2"></i> Focus on Task
          </h5>
        </div>
        <div className="card-body py-2" style={{ color: currentTheme.text }}>
          {loading ? (
            <div className="text-center py-2">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading tasks...</span>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-2">
              <i className="bi bi-inbox me-2"></i>
              No active tasks found
            </div>
          ) : (
            <>
              <select
                value={currentTask ? currentTask.id : ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                    setCurrentTask(null);
                  } else {
                    const selectedTask = tasks.find(
                      (task) => task.id === parseInt(e.target.value)
                    );
                    setCurrentTask(selectedTask || null);
                  }
                }}
                className="form-select mb-2"
              >
                <option value="">Select a task to focus on...</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              {currentTask && (
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <small style={{ color: currentTheme.mutedText }}>
                    <i className="bi bi-clock-history me-1"></i>
                    {currentTask.dueDate &&
                      new Date(currentTask.dueDate).toLocaleDateString()}
                  </small>
                  <div>
                    <span
                      className="badge task-badge"
                      style={{
                        backgroundColor: getPriorityColor(currentTask.priority),
                      }}
                    >
                      {currentTask.priority}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn btn-sm clear-task-btn"
                      onClick={() => setCurrentTask(null)}
                    >
                      <i className="bi bi-x"></i> Clear
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Add this helper function for task priority colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return isDarkMode ? "#FF5252" : "#F44336";
      case "Medium":
        return isDarkMode ? "#FFD740" : "#FFC107";
      case "Low":
        return isDarkMode ? "#69F0AE" : "#4CAF50";
      default:
        return isDarkMode ? "#B0BEC5" : "#9E9E9E";
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar with fixed width */}
      <div className="sidebar-wrapper">
        <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      </div>

      {/* Main content area */}
      <div
        className="dashboard-container flex-grow-1 p-3 p-md-4"
        style={{
          backgroundColor: currentTheme.background,
          color: currentTheme.text,
        }}
      >
        <div className="container-fluid px-0">
          {/* Header */}
          <header
            className="header-section"
            style={{
              backgroundColor: currentTheme.headerBg,
            }}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="d-flex align-items-center"
              >
                <h2
                  className="fw-bold mb-0"
                  style={{ color: currentTheme.primary }}
                >
                  <i className="bi bi-alarm me-2"></i> Pomodoro Timer
                </h2>
                {loading && (
                  <div
                    className="spinner-border spinner-border-sm ms-3"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}
              </motion.div>

              <div className="d-flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-action shadow-sm"
                  onClick={handleReset}
                  style={{
                    backgroundColor: isDarkMode
                      ? currentTheme.cardBg
                      : "#ffffff",
                    color: currentModeColors.primary,
                    border: `2px solid ${currentModeColors.primary}`,
                    borderRadius: "12px",
                    padding: "8px 14px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-action shadow-sm"
                  onClick={() => setShowSettings(true)}
                  style={{
                    backgroundColor: currentModeColors.primary,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "12px",
                    padding: "8px 16px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <i className="bi bi-gear me-2"></i> Settings
                </motion.button>
              </div>
            </div>

            <div className="mt-2 d-flex flex-wrap justify-content-between align-items-center">
              <p style={{ color: currentTheme.mutedText }} className="mb-0">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <span
                className="badge rounded-pill"
                style={{
                  backgroundColor: currentModeColors.primary,
                  color: "#FFFFFF",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                {completedPomodoros} sessions completed
              </span>
            </div>
          </header>

          {/* Mode Selector Card */}
          <div className="card shadow-sm mode-selector">
            <div className="card-header d-flex justify-content-between align-items-center py-2">
              <h5 className="mb-0">
                <i className="bi bi-hourglass-split me-2"></i> Timer Mode
              </h5>
            </div>
            <div className="card-body py-3">
              <div className="btn-group w-100">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn mode-btn"
                  onClick={() => switchMode("pomodoro")}
                  style={{
                    backgroundColor:
                      mode === "pomodoro"
                        ? getModeColors("pomodoro").primary
                        : "transparent",
                    color:
                      mode === "pomodoro"
                        ? "#FFFFFF"
                        : getModeColors("pomodoro").primary,
                    borderColor: getModeColors("pomodoro").primary,
                  }}
                >
                  <i className="bi bi-stopwatch me-2"></i> Pomodoro
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn mode-btn"
                  onClick={() => switchMode("shortBreak")}
                  style={{
                    backgroundColor:
                      mode === "shortBreak"
                        ? getModeColors("shortBreak").primary
                        : "transparent",
                    color:
                      mode === "shortBreak"
                        ? "#FFFFFF"
                        : getModeColors("shortBreak").primary,
                    borderColor: getModeColors("shortBreak").primary,
                  }}
                >
                  <i className="bi bi-cup-hot me-2"></i> Short Break
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn mode-btn"
                  onClick={() => switchMode("longBreak")}
                  style={{
                    backgroundColor:
                      mode === "longBreak"
                        ? getModeColors("longBreak").primary
                        : "transparent",
                    color:
                      mode === "longBreak"
                        ? "#FFFFFF"
                        : getModeColors("longBreak").primary,
                    borderColor: getModeColors("longBreak").primary,
                  }}
                >
                  <i className="bi bi-battery-charging me-2"></i> Long Break
                </motion.button>
              </div>
            </div>
          </div>

          {/* Timer Display Card */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi bi-clock me-2"></i> Timer
                    </h5>
                    <div className="progress timer-progress">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: `${calculateProgress()}%`,
                          backgroundColor: currentModeColors.primary,
                        }}
                        aria-valuenow={calculateProgress()}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                </div>
                <div
                  className="card-body timer-display"
                  style={{
                    backgroundColor: currentModeColors.bg,
                  }}
                >
                  <motion.div
                    key={time}
                    initial={{ opacity: 0.5, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4"
                  >
                    <h1
                      className="display-1 fw-bold mb-0 timer-digits"
                      style={{
                        color: currentModeColors.primary,
                      }}
                    >
                      {formatTime(time)}
                    </h1>
                  </motion.div>

                  {/* Current task display */}
                  {currentTask && (
                    <div
                      className="alert current-task-alert"
                      style={{
                        backgroundColor: `${currentModeColors.bg}`,
                        borderColor: currentModeColors.border,
                        color:
                          mode === "pomodoro" && isDarkMode
                            ? "#fff"
                            : currentModeColors.primary,
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <i className="bi bi-arrow-right-circle me-2"></i>
                        <span>
                          Working on: <strong>{currentTask.title}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  <motion.button
                    className="btn btn-lg timer-button"
                    onClick={() => setRunning(!running)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      backgroundColor: currentModeColors.primary,
                      color: "white",
                    }}
                  >
                    {running ? (
                      <>
                        <i className="bi bi-pause-fill me-2"></i> PAUSE
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-fill me-2"></i> START
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Task Selection Card */}
          {tasks.length > 0 && <TaskSelector />}

          {/* Tips Card */}
          <div className="card shadow-sm mb-3 tip-card">
            <div className="card-body">
              <h5 className="mb-3">
                <i className="bi bi-lightbulb me-2 text-warning"></i>
                Pomodoro Technique
              </h5>
              <p className="mb-0">
                The Pomodoro Technique is a time management method that uses
                timed work intervals, typically 25 minutes in length, separated
                by short breaks. After four pomodoros, take a longer break. This
                helps improve focus and maintain mental freshness.
              </p>
            </div>
          </div>
        </div>

        {/* Settings modal */}
        {showSettings && <SettingsModal />}
      </div>

      {/* Audio for timer completion */}
      <audio ref={audioRef} preload="auto">
        <source
          src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
          type="audio/mp3"
        />
        Your browser does not support the audio element.
      </audio>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Pomodoro;
