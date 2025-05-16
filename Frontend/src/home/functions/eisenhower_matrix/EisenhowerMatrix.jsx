import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import axios from "axios";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CiSearch } from "react-icons/ci"; // Add the search icon import

const EisenhowerMatrix = () => {
  const [tasks, setTasks] = useState([]);
  const [quadrants, setQuadrants] = useState({
    doFirst: [],
    schedule: [],
    delegate: [],
    eliminate: [],
  });
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [highlightedQuadrant, setHighlightedQuadrant] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [authError, setAuthError] = useState(false);

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
  };

  // Effect to sync dark mode with system preference or localStorage
  useEffect(() => {
    const darkModeFromStorage = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeFromStorage);
  }, []);

  // Add this effect to listen for theme changes
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

  // Get user token for API calls - add proper checking
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Check token on component mount
  useEffect(() => {
    // Verify token exists and refresh if needed
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      toast.error("Authentication required. Please log in again.");
      setAuthError(true);
    } else {
      setToken(storedToken);
    }
  }, []);

  // Fetch tasks from the API - use the correct endpoint from your backend
  useEffect(() => {
    const fetchTasks = async () => {
      if (!token) {
        setLoading(false);
        return; // Don't fetch if no token
      }

      try {
        setLoading(true);
        console.log(
          "Fetching tasks with token:",
          token ? "Token exists" : "No token"
        );

        // Use the correct endpoint as shown in your TaskController.java
        const response = await axios.get("http://localhost:8080/getTask", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("API Response:", response.data);

        // Map API response to task format we need
        const formattedTasks = response.data.map((task) => ({
          id: task.id,
          name: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          status: task.status,
        }));

        // Load existing matrix data if available
        const savedMatrix = localStorage.getItem("eisenhowerMatrix");
        if (savedMatrix) {
          try {
            const parsedMatrix = JSON.parse(savedMatrix);

            // Check if parsed data has the expected structure
            if (
              parsedMatrix &&
              parsedMatrix.doFirst &&
              parsedMatrix.schedule &&
              parsedMatrix.delegate &&
              parsedMatrix.eliminate
            ) {
              setQuadrants(parsedMatrix);

              // Filter out tasks that are already in the matrix
              const taskIds = [
                ...parsedMatrix.doFirst,
                ...parsedMatrix.schedule,
                ...parsedMatrix.delegate,
                ...parsedMatrix.eliminate,
              ].map((t) => t.id);

              setTasks(
                formattedTasks.filter((task) => !taskIds.includes(task.id))
              );
            } else {
              // Invalid format, start fresh
              console.warn("Invalid saved matrix format, starting fresh");
              setTasks(formattedTasks);
            }
          } catch (parseError) {
            console.error("Error parsing saved matrix:", parseError);
            localStorage.removeItem("eisenhowerMatrix");
            setTasks(formattedTasks);
          }
        } else {
          setTasks(formattedTasks);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);

        // More detailed error handling
        if (error.response) {
          console.log("Error response status:", error.response.status);
          console.log("Error response data:", error.response.data);

          if (error.response.status === 401) {
            toast.error("Your session has expired. Please login again.");
            setAuthError(true);
            // Clear invalid token
            localStorage.removeItem("token");
            // Show login guidance
            setTimeout(() => {
              if (confirm("Would you like to login again?")) {
                window.location.href = "/login";
              }
            }, 2000);
            return;
          }
        }

        toast.error("Could not load tasks. Please try again later.");
        // Fallback to dummy data if API fails
        setTasks([
          { id: 1, name: "Finish project report", priority: "High" },
          { id: 2, name: "Schedule dentist appointment", priority: "Medium" },
          { id: 3, name: "Reply to urgent client emails", priority: "High" },
          { id: 4, name: "Organize desk", priority: "Low" },
          { id: 5, name: "Buy groceries", priority: "Medium" },
          { id: 6, name: "Plan next week's agenda", priority: "Medium" },
          { id: 7, name: "Pay electricity bill", priority: "High" },
          { id: 8, name: "Book flight tickets", priority: "Low" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [token]);

  // Save matrix state to localStorage when it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("eisenhowerMatrix", JSON.stringify(quadrants));
    }
  }, [quadrants, loading]);

  const handleDragStart = (task, source = "list") => {
    setDraggedTask({ ...task, source });
  };

  const handleDragEnd = () => {
    setHighlightedQuadrant(null);
    setDraggedTask(null);
  };

  const handleDrop = (quadrant) => {
    if (!draggedTask) return;

    const task = draggedTask;
    const source = task.source || "list";

    // Show visual feedback
    toast.success(`Task moved to ${getQuadrantName(quadrant)}`, {
      position: "bottom-right",
      autoClose: 1500,
    });

    if (source === "list") {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setQuadrants((prev) => ({
        ...prev,
        [quadrant]: [...prev[quadrant], task],
      }));
    } else if (source !== quadrant) {
      // Only update if moving to a different quadrant
      setQuadrants((prev) => ({
        ...prev,
        [source]: prev[source].filter((t) => t.id !== task.id),
        [quadrant]: [...prev[quadrant], task],
      }));
    }

    setHighlightedQuadrant(null);
  };

  const handleDragOver = (quadrant) => {
    setHighlightedQuadrant(quadrant);
  };

  const getQuadrantName = (key) => {
    const names = {
      doFirst: "Do First",
      schedule: "Schedule",
      delegate: "Delegate",
      eliminate: "Eliminate",
    };
    return names[key] || key;
  };

  const resetMatrix = () => {
    // Ask for confirmation
    if (
      window.confirm(
        "Are you sure you want to reset the matrix? This will move all tasks back to the task list."
      )
    ) {
      // Move all tasks from quadrants back to task list
      const allQuadrantTasks = [
        ...quadrants.doFirst,
        ...quadrants.schedule,
        ...quadrants.delegate,
        ...quadrants.eliminate,
      ];

      setTasks((prev) => [...prev, ...allQuadrantTasks]);
      setQuadrants({
        doFirst: [],
        schedule: [],
        delegate: [],
        eliminate: [],
      });

      // Clear saved data
      localStorage.removeItem("eisenhowerMatrix");

      toast.info("Eisenhower Matrix has been reset");
    }
  };

  // Helper to determine task color based on priority
  const getTaskColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return isDarkMode ? currentTheme.danger : "#f44336";
      case "medium":
        return isDarkMode ? currentTheme.warning : "#ff9800";
      case "low":
        return isDarkMode ? currentTheme.success : "#4caf50";
      default:
        return isDarkMode ? currentTheme.secondary : "#757575";
    }
  };

  // Filter tasks based on search term
  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderTask = (task, source = "list") => (
    <motion.li
      key={task.id}
      draggable
      onDragStart={() => handleDragStart(task, source)}
      onDragEnd={handleDragEnd}
      className="p-2 mb-2 rounded shadow-sm task-item"
      style={{
        border: `1px solid ${getTaskColor(task.priority || "medium")}`,
        borderLeft: `5px solid ${getTaskColor(task.priority || "medium")}`,
        cursor: "grab",
        transition: "all 0.2s ease",
        position: "relative",
        backgroundColor: isDarkMode ? currentTheme.headerBg : "#fff",
        color: currentTheme.text,
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="d-flex justify-content-between align-items-center">
        <span className="task-name">{task.name}</span>
        <small
          className={`badge ${
            task.priority === "High"
              ? isDarkMode
                ? "bg-danger"
                : "bg-danger"
              : task.priority === "Medium"
              ? isDarkMode
                ? "bg-warning text-dark"
                : "bg-warning text-dark"
              : isDarkMode
              ? "bg-success"
              : "bg-success"
          }`}
        >
          {task.priority || "Medium"}
        </small>
      </div>
      {task.dueDate && (
        <small
          style={{ color: currentTheme.mutedText }}
          className="d-block mt-1"
        >
          <i className="bi bi-calendar"></i>{" "}
          {new Date(task.dueDate).toLocaleDateString()}
        </small>
      )}
    </motion.li>
  );

  // Show auth error screen if not authenticated
  if (authError) {
    return (
      <div
        className="d-flex flex-column flex-md-row"
        style={{ minHeight: "100vh" }}
      >
        <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <div
          className="container-fluid p-2 p-md-4 flex-grow-1 d-flex flex-column justify-content-center align-items-center"
          style={{
            backgroundColor: currentTheme.background,
            color: currentTheme.text,
          }}
        >
          <div className="text-center">
            <i
              className="bi bi-shield-lock text-danger"
              style={{ fontSize: "4rem" }}
            ></i>
            <h2 className="mt-3">Authentication Required</h2>
            <p style={{ color: currentTheme.mutedText }} className="mb-4">
              You need to be logged in to use the Eisenhower Matrix
            </p>
            <button
              className="btn btn-primary me-2"
              onClick={() => (window.location.href = "/login")}
            >
              Login
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => (window.location.href = "/")}
              style={{
                color: currentTheme.secondary,
                borderColor: currentTheme.secondary,
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
        <ToastContainer position="bottom-right" />
      </div>
    );
  }

  const quadrantStyle = (color, bg, isHighlighted) => {
    // Define quadrant colors for light and dark mode
    const quadColors = {
      doFirst: {
        light: { border: "#4DB6AC", bg: "#E0F7FA" },
        dark: { border: "#4DB6AC", bg: "rgba(77, 182, 172, 0.15)" },
      },
      schedule: {
        light: { border: "#4A90E2", bg: "#E3F2FD" },
        dark: { border: "#4A90E2", bg: "rgba(74, 144, 226, 0.15)" },
      },
      delegate: {
        light: { border: "#FF7043", bg: "#FFEBEE" },
        dark: { border: "#FF7043", bg: "rgba(255, 112, 67, 0.15)" },
      },
      eliminate: {
        light: { border: "#B0BEC5", bg: "#ECEFF1" },
        dark: { border: "#B0BEC5", bg: "rgba(176, 190, 197, 0.15)" },
      },
    };

    // Select the appropriate color set based on the quadrant and theme
    let colorSet;
    if (color === "#4DB6AC") colorSet = quadColors.doFirst;
    else if (color === "#4A90E2") colorSet = quadColors.schedule;
    else if (color === "#FF7043") colorSet = quadColors.delegate;
    else colorSet = quadColors.eliminate;

    const selectedColors = isDarkMode ? colorSet.dark : colorSet.light;

    return {
      border: `2px ${isHighlighted ? "solid" : "dashed"} ${
        selectedColors.border
      }`,
      borderRadius: "12px",
      minHeight: "200px",
      height: "100%",
      padding: "15px",
      backgroundColor: isHighlighted
        ? `${selectedColors.bg}dd`
        : selectedColors.bg,
      transition: "all 0.3s",
      overflowY: "auto",
      boxShadow: isHighlighted ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
    };
  };

  // Modify the return statement with better layout and styling
  return (
    <div
      className="d-flex flex-column flex-md-row"
      style={{
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: currentTheme.background,
        color: currentTheme.text,
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <div className="container-fluid p-2 p-md-3 flex-grow-1">
        <div className="row mb-2 align-items-center">
          <div className="col-md-6">
            <h3 className="fw-bold" style={{ color: currentTheme.primary }}>
              <i className="bi bi-grid-3x3 me-2"></i>
              Eisenhower Matrix
            </h3>
            <p style={{ color: currentTheme.mutedText }} className="mb-1">
              Prioritize tasks by urgency and importance
            </p>
          </div>
          <div className="col-md-6 d-flex justify-content-md-end mt-2 mt-md-0">
            <button
              className="btn btn-sm me-2"
              onClick={resetMatrix}
              style={{
                backgroundColor: "transparent",
                color: currentTheme.danger,
                borderColor: currentTheme.danger,
              }}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Matrix
            </button>
            <button
              className="btn btn-sm"
              onClick={() => {
                localStorage.setItem(
                  "eisenhowerMatrix",
                  JSON.stringify(quadrants)
                );
                toast.info("Matrix saved successfully!");
              }}
              style={{
                backgroundColor: "transparent",
                color: currentTheme.primary,
                borderColor: currentTheme.primary,
              }}
            >
              <i className="bi bi-save me-1"></i> Save Matrix
            </button>
          </div>
        </div>

        <div className="row" style={{ height: "calc(100vh - 120px)" }}>
          {/* Task List Panel */}
          <div className="col-md-3 mb-3 mb-md-0" style={{ height: "100%" }}>
            <div
              className="card shadow-sm h-100"
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "10px",
              }}
            >
              <div
                className="card-header py-2"
                style={{
                  backgroundColor: isDarkMode
                    ? currentTheme.headerBg
                    : "rgba(249, 250, 251, 0.7)",
                  borderBottom: `1px solid ${currentTheme.border}`,
                  borderTopLeftRadius: "10px",
                  borderTopRightRadius: "10px",
                }}
              >
                <h5
                  className="mb-0 py-1"
                  style={{ color: currentTheme.primary }}
                >
                  <i className="bi bi-list-check me-2"></i>Task List
                </h5>
              </div>
              <div className="card-body p-2">
                <div className="input-group mb-2">
                  <span
                    className="input-group-text"
                    style={{
                      backgroundColor: isDarkMode
                        ? currentTheme.headerBg
                        : "#FFFFFF",
                      borderColor: currentTheme.border,
                      color: currentTheme.mutedText,
                    }}
                  >
                    <CiSearch size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      backgroundColor: isDarkMode
                        ? currentTheme.headerBg
                        : "#FFFFFF",
                      color: currentTheme.text,
                      borderColor: currentTheme.border,
                    }}
                  />
                </div>

                {loading ? (
                  <div className="d-flex justify-content-center p-4">
                    <div
                      className="spinner-border"
                      role="status"
                      style={{ color: currentTheme.primary }}
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div
                    className="text-center p-4"
                    style={{ color: currentTheme.mutedText }}
                  >
                    <i className="bi bi-inbox-fill display-4"></i>
                    <p className="mt-3" style={{ color: currentTheme.text }}>
                      No tasks available
                    </p>
                    <small>
                      All tasks have been organized or no tasks match your
                      search
                    </small>
                  </div>
                ) : (
                  <ul
                    className="list-unstyled task-list"
                    style={{ height: "calc(100% - 50px)", overflowY: "auto" }}
                  >
                    {filteredTasks.map((task) => renderTask(task))}
                  </ul>
                )}
              </div>
              <div
                className="card-footer text-center py-1"
                style={{
                  backgroundColor: isDarkMode
                    ? currentTheme.headerBg
                    : "rgba(249, 250, 251, 0.7)",
                  borderTop: `1px solid ${currentTheme.border}`,
                  color: currentTheme.mutedText,
                  borderBottomLeftRadius: "10px",
                  borderBottomRightRadius: "10px",
                }}
              >
                <small>Drag tasks to organize them in the matrix</small>
              </div>
            </div>
          </div>

          {/* Matrix Panel - Modified for better fit */}
          <div className="col-md-9" style={{ height: "100%" }}>
            <div className="matrix-container h-100">
              <div className="row g-3 h-100">
                <div className="col-md-6" style={{ height: "50%" }}>
                  <div
                    className="h-100"
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver("doFirst");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop("doFirst");
                    }}
                    style={{
                      ...quadrantStyle(
                        "#4DB6AC",
                        "#E0F7FA",
                        highlightedQuadrant === "doFirst"
                      ),
                      padding: "10px",
                    }}
                  >
                    <div className="quadrant-header d-flex justify-content-between align-items-center mb-1">
                      <h6
                        className="m-0 fw-bold"
                        style={{ color: isDarkMode ? "#4DB6AC" : "#00796B" }}
                      >
                        <i className="bi bi-1-circle-fill me-1"></i> Important &
                        Urgent
                      </h6>
                      <span
                        className="badge rounded-pill text-white"
                        style={{
                          backgroundColor: isDarkMode ? "#4DB6AC" : "#009688",
                        }}
                      >
                        {quadrants.doFirst.length}
                      </span>
                    </div>
                    <p
                      className="quadrant-description small mb-1"
                      style={{ color: currentTheme.mutedText }}
                    >
                      Tasks that need immediate attention
                    </p>
                    <ul
                      className="list-unstyled"
                      style={{
                        overflowY: "auto",
                        height: "calc(100% - 50px)",
                      }}
                    >
                      {quadrants.doFirst.map((task) =>
                        renderTask(task, "doFirst")
                      )}
                    </ul>
                  </div>
                </div>

                <div className="col-md-6" style={{ height: "50%" }}>
                  <div
                    className="h-100"
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver("schedule");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop("schedule");
                    }}
                    style={{
                      ...quadrantStyle(
                        "#4A90E2",
                        "#E3F2FD",
                        highlightedQuadrant === "schedule"
                      ),
                      padding: "10px",
                    }}
                  >
                    <div className="quadrant-header d-flex justify-content-between align-items-center mb-1">
                      <h6
                        className="m-0 fw-bold"
                        style={{ color: isDarkMode ? "#4A90E2" : "#1565C0" }}
                      >
                        <i className="bi bi-2-circle-fill me-1"></i> Important &
                        Not Urgent
                      </h6>
                      <span
                        className="badge bg-primary text-white rounded-pill"
                        style={{
                          backgroundColor: isDarkMode ? "#4A90E2" : undefined,
                        }}
                      >
                        {quadrants.schedule.length}
                      </span>
                    </div>
                    <p
                      className="quadrant-description small mb-1"
                      style={{ color: currentTheme.mutedText }}
                    >
                      Tasks to schedule for later
                    </p>
                    <ul
                      className="list-unstyled"
                      style={{
                        overflowY: "auto",
                        height: "calc(100% - 50px)",
                      }}
                    >
                      {quadrants.schedule.map((task) =>
                        renderTask(task, "schedule")
                      )}
                    </ul>
                  </div>
                </div>

                <div className="col-md-6" style={{ height: "50%" }}>
                  <div
                    className="h-100"
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver("delegate");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop("delegate");
                    }}
                    style={{
                      ...quadrantStyle(
                        "#FF7043",
                        "#FFEBEE",
                        highlightedQuadrant === "delegate"
                      ),
                      padding: "10px",
                    }}
                  >
                    <div className="quadrant-header d-flex justify-content-between align-items-center mb-1">
                      <h6
                        className="m-0 fw-bold"
                        style={{ color: isDarkMode ? "#FF7043" : "#D84315" }}
                      >
                        <i className="bi bi-3-circle-fill me-1"></i> Not
                        Important & Urgent
                      </h6>
                      <span
                        className="badge rounded-pill"
                        style={{
                          backgroundColor: isDarkMode ? "#FF7043" : "#ff9800",
                          color: isDarkMode ? "white" : "#212529",
                        }}
                      >
                        {quadrants.delegate.length}
                      </span>
                    </div>
                    <p
                      className="quadrant-description small mb-1"
                      style={{ color: currentTheme.mutedText }}
                    >
                      Tasks to delegate to others
                    </p>
                    <ul
                      className="list-unstyled"
                      style={{
                        overflowY: "auto",
                        height: "calc(100% - 50px)",
                      }}
                    >
                      {quadrants.delegate.map((task) =>
                        renderTask(task, "delegate")
                      )}
                    </ul>
                  </div>
                </div>

                <div className="col-md-6" style={{ height: "50%" }}>
                  <div
                    className="h-100"
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver("eliminate");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop("eliminate");
                    }}
                    style={{
                      ...quadrantStyle(
                        "#B0BEC5",
                        "#ECEFF1",
                        highlightedQuadrant === "eliminate"
                      ),
                      padding: "10px",
                    }}
                  >
                    <div className="quadrant-header d-flex justify-content-between align-items-center mb-1">
                      <h6
                        className="m-0 fw-bold"
                        style={{ color: isDarkMode ? "#B0BEC5" : "#607D8B" }}
                      >
                        <i className="bi bi-4-circle-fill me-1"></i> Not
                        Important & Not Urgent
                      </h6>
                      <span
                        className="badge bg-secondary text-white rounded-pill"
                        style={{
                          backgroundColor: isDarkMode ? "#B0BEC5" : undefined,
                          color: isDarkMode ? "#212529" : undefined,
                        }}
                      >
                        {quadrants.eliminate.length}
                      </span>
                    </div>
                    <p
                      className="quadrant-description small mb-1"
                      style={{ color: currentTheme.mutedText }}
                    >
                      Tasks to eliminate or do later
                    </p>
                    <ul
                      className="list-unstyled"
                      style={{
                        overflowY: "auto",
                        height: "calc(100% - 50px)",
                      }}
                    >
                      {quadrants.eliminate.map((task) =>
                        renderTask(task, "eliminate")
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Card - Only visible on mobile */}
        <div className="d-md-none mt-3">
          {/* ...existing mobile instructions card... */}
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default EisenhowerMatrix;
