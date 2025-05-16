import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import HabitProgressBar from "./HabitProgressBar";
import HabitChart from "./HabitChart";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../../components/Sidebar";
import confetti from "canvas-confetti";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoRefreshSharp } from "react-icons/io5";

const DailyPlanner = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newHabit, setNewHabit] = useState("");
  const [editId, setEditId] = useState(null);
  const [showStats, setShowStats] = useState(true);

  // Update to use the standard theme approach from HomePage/Dashboard
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Calculate stats
  const completedHabits = habits.filter((h) => h.status === "COMPLETED").length;
  const totalHabits = habits.length;

  // Theme color palettes - Same as HomePage and Dashboard
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

  // Fetch habits from the backend
  const fetchHabits = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get("http://localhost:8080/getHabit", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHabits(response.data || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks. Please try again.");

      // Show error notification
      toast.error("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load habits on component mount
  useEffect(() => {
    fetchHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Confetti effect when all habits are completed
  useEffect(() => {
    if (totalHabits > 0 && completedHabits === totalHabits) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        Swal.fire({
          title: "Great job!",
          text: "You've completed all your Tasks for today!",
          icon: "success",
          confirmButtonColor: isDarkMode ? "#4DB6AC" : "#195283",
          background: isDarkMode ? "#1E1E1E" : "#ffffff",
          color: isDarkMode ? "#e0e0e0" : "#333",
        });
      }, 1000);
    }
  }, [completedHabits, totalHabits, isDarkMode]);

  const handleAddHabit = async () => {
    if (newHabit.trim() === "") {
      toast.warning("Please enter a habit before adding.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (editId) {
      // Update existing habit
      try {
        await axios.put(
          "http://localhost:8080/updateHabit",
          {
            id: editId,
            title: newHabit,
            status: habits.find((h) => h.id === editId)?.status || "INCOMPLETE",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        toast.success("Your Task has been updated.");

        setEditId(null);
        setNewHabit("");
        fetchHabits();
      } catch (err) {
        console.error("Error updating Task:", err);
        toast.error("Failed to update Task.");
      }
    } else {
      // Add new habit
      try {
        await axios.post(
          "http://localhost:8080/addHabit",
          {
            title: newHabit,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        toast.success("New Task has been added.");

        setNewHabit("");
        fetchHabits();
      } catch (err) {
        console.error("Error adding Task:", err);
        toast.error("Failed to add Task.");
      }
    }
  };

  const handleDeleteHabit = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isDarkMode ? currentTheme.danger : "#dc3545",
      cancelButtonColor: isDarkMode ? currentTheme.secondary : "#6c757d",
      confirmButtonText: "Yes, delete it!",
      background: isDarkMode ? currentTheme.cardBg : "#ffffff",
      color: isDarkMode ? currentTheme.text : "#333",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:8080/deleteHabit/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          toast.success("Task has been removed.");
          fetchHabits();
        } catch (err) {
          console.error("Error deleting Task:", err);
          toast.error("Failed to delete Task.");
        }
      }
    });
  };

  const handleToggleComplete = async (habit) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const newStatus =
      habit.status === "COMPLETED" ? "INCOMPLETED" : "COMPLETED";

    try {
      await axios.put(
        "http://localhost:8080/updateHabit",
        {
          id: habit.id,
          title: habit.title,
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Show confetti for newly completed habit
      if (newStatus === "COMPLETED") {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
        });
      }

      fetchHabits();
    } catch (err) {
      console.error("Error updating Task status:", err);
      toast.error("Failed to update Task status.");
    }
  };

  const handleEditHabit = (habit) => {
    setNewHabit(habit.title);
    setEditId(habit.id);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddHabit();
    }
  };

  const filteredHabits = habits.filter((habit) =>
    habit.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2 },
    },
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 100 },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <div
        className="dashboard-container flex-grow-1 p-3 p-md-4"
        style={{
          backgroundColor: currentTheme.background,
          color: currentTheme.text,
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        <div className="container-fluid px-0">
          {/* Header - similar to HomePage */}
          <header
            className="mb-4 p-3 rounded-3"
            style={{
              backgroundColor: currentTheme.headerBg,
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
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
                  <i className="bi bi-check2-circle me-2"></i> Daily Tasks
                </h2>
                {loading && (
                  <div
                    className="spinner-border spinner-border-sm ms-3"
                    role="status"
                    style={{ color: currentTheme.primary }}
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}
              </motion.div>

              <div className="d-flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-sm"
                  onClick={fetchHabits} // Change from fetchDashboardData to fetchHabits
                  style={{
                    backgroundColor: isDarkMode ? "transparent" : "transparent",
                    color: currentTheme.primary,
                    border: `1px solid ${currentTheme.primary}`,
                  }}
                >
                  <IoRefreshSharp className="me-1" /> Refresh
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: showStats
                      ? "transparent"
                      : currentTheme.secondary,
                    color: showStats ? currentTheme.secondary : "#fff",
                    border: `1px solid ${
                      showStats
                        ? currentTheme.secondary
                        : currentTheme.secondary
                    }`,
                  }}
                  onClick={() => setShowStats(!showStats)}
                >
                  <i
                    className={`bi ${
                      showStats ? "bi-eye-slash" : "bi-graph-up"
                    } me-1`}
                  ></i>
                  {showStats ? "Hide Stats" : "Show Stats"}
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
                  backgroundColor: currentTheme.success,
                  color: "#ffffff",
                }}
              >
                {completedHabits}/{totalHabits} Completed
              </span>
            </div>
          </header>

          {/* Search and Add New Task Row */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div
                className="card shadow-sm mb-3"
                style={{
                  backgroundColor: currentTheme.cardBg,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: "10px",
                }}
              >
                <div
                  className="card-header d-flex justify-content-between align-items-center py-2"
                  style={{
                    backgroundColor: isDarkMode
                      ? currentTheme.headerBg
                      : currentTheme.cardBg,
                    borderBottom: `1px solid ${currentTheme.border}`,
                    borderTopLeftRadius: "10px",
                    borderTopRightRadius: "10px",
                  }}
                >
                  <h5 className="mb-0" style={{ color: currentTheme.text }}>
                    <i className="bi bi-plus-circle me-2"></i> Add New Task
                  </h5>
                </div>
                <div className="card-body py-3">
                  <div className="row">
                    <div className="col-md-8 mb-3 mb-md-0">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder={
                            editId ? "Edit task..." : "Enter a new task..."
                          }
                          value={newHabit}
                          onChange={(e) => setNewHabit(e.target.value)}
                          onKeyPress={handleKeyPress}
                          style={{
                            backgroundColor: isDarkMode
                              ? currentTheme.background
                              : "#FFFFFF",
                            color: currentTheme.text,
                            borderColor: currentTheme.border,
                          }}
                        />
                        <button
                          className="btn"
                          style={{
                            backgroundColor: currentTheme.primary,
                            color: "#ffffff",
                            borderColor: currentTheme.primary,
                          }}
                          onClick={handleAddHabit}
                        >
                          {editId ? (
                            <>
                              <i className="bi bi-check-lg me-1"></i> Update
                            </>
                          ) : (
                            <>
                              <i className="bi bi-plus-lg me-1"></i> Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="input-group">
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
                          <i className="bi bi-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search tasks..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="row mb-4"
              >
                <div className="col-md-6 mb-3 mb-md-0">
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
                          : currentTheme.cardBg,
                        borderBottom: `1px solid ${currentTheme.border}`,
                        borderTopLeftRadius: "10px",
                        borderTopRightRadius: "10px",
                      }}
                    >
                      <h5 className="mb-0" style={{ color: currentTheme.text }}>
                        <i className="bi bi-bar-chart-line me-2"></i> Progress
                      </h5>
                    </div>
                    <div className="card-body">
                      <HabitProgressBar
                        completedHabits={completedHabits}
                        totalHabits={totalHabits}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
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
                          : currentTheme.cardBg,
                        borderBottom: `1px solid ${currentTheme.border}`,
                        borderTopLeftRadius: "10px",
                        borderTopRightRadius: "10px",
                      }}
                    >
                      <h5 className="mb-0" style={{ color: currentTheme.text }}>
                        <i className="bi bi-pie-chart me-2"></i> Overview
                      </h5>
                    </div>
                    <div className="card-body">
                      <HabitChart
                        completedHabits={completedHabits}
                        totalHabits={totalHabits}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tasks List */}
          <div className="row">
            <div className="col-12">
              <div
                className="card shadow-sm"
                style={{
                  backgroundColor: currentTheme.cardBg,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: "10px",
                }}
              >
                <div
                  className="card-header py-3"
                  style={{
                    backgroundColor: isDarkMode
                      ? currentTheme.headerBg
                      : currentTheme.cardBg,
                    borderBottom: `1px solid ${currentTheme.border}`,
                    borderTopLeftRadius: "10px",
                    borderTopRightRadius: "10px",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0" style={{ color: currentTheme.text }}>
                      <i className="bi bi-list-check me-2"></i> Tasks List
                    </h5>
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: currentTheme.success,
                        color: "#ffffff",
                      }}
                    >
                      {filteredHabits.length}{" "}
                      {filteredHabits.length === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  {/* Loading State */}
                  {loading ? (
                    <div className="d-flex justify-content-center py-5">
                      <div
                        className="spinner-border"
                        role="status"
                        style={{ color: currentTheme.primary }}
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="alert alert-danger m-3" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  ) : filteredHabits.length === 0 ? (
                    <div
                      className="text-center py-5"
                      style={{ color: currentTheme.mutedText }}
                    >
                      <i className="bi bi-inbox display-1"></i>
                      <p
                        className="mt-3 mb-0"
                        style={{ color: currentTheme.text }}
                      >
                        No tasks found
                      </p>
                      <p>
                        {searchQuery
                          ? "Try adjusting your search query"
                          : "Add your first daily task above"}
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      variants={listVariants}
                      initial="hidden"
                      animate="visible"
                      className="task-list p-3"
                    >
                      <AnimatePresence>
                        {filteredHabits.map((habit) => (
                          <motion.div
                            key={habit.id}
                            variants={listItemVariants}
                            exit="exit"
                            className="card mb-3 border-0 shadow-sm"
                          >
                            <div
                              className="card-body d-flex justify-content-between align-items-center"
                              style={{
                                backgroundColor: isDarkMode
                                  ? currentTheme.cardBg
                                  : "#fff",
                              }}
                            >
                              <div className="d-flex align-items-center flex-grow-1">
                                <div className="form-check me-3">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={habit.status === "COMPLETED"}
                                    onChange={() => handleToggleComplete(habit)}
                                    style={{
                                      transform: "scale(1.2)",
                                      cursor: "pointer",
                                      accentColor: currentTheme.success,
                                    }}
                                  />
                                </div>
                                <span
                                  className="fs-5"
                                  style={{
                                    textDecoration:
                                      habit.status === "COMPLETED"
                                        ? "line-through"
                                        : "none",
                                    opacity:
                                      habit.status === "COMPLETED" ? 0.7 : 1,
                                    color:
                                      habit.status === "COMPLETED"
                                        ? isDarkMode
                                          ? currentTheme.mutedText
                                          : "#666"
                                        : currentTheme.text,
                                  }}
                                >
                                  {habit.title}
                                </span>
                              </div>
                              <div className="d-flex">
                                <button
                                  className="btn btn-sm me-2"
                                  style={{
                                    backgroundColor: "transparent",
                                    color: currentTheme.primary,
                                    border: `1px solid ${currentTheme.primary}`,
                                  }}
                                  onClick={() => handleEditHabit(habit)}
                                >
                                  <i className="bi bi-pencil-square"></i>
                                  <span className="d-none d-sm-inline ms-1">
                                    Edit
                                  </span>
                                </button>
                                <button
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: "transparent",
                                    color: currentTheme.danger,
                                    border: `1px solid ${currentTheme.danger}`,
                                  }}
                                  onClick={() => handleDeleteHabit(habit.id)}
                                >
                                  <i className="bi bi-trash"></i>
                                  <span className="d-none d-sm-inline ms-1">
                                    Delete
                                  </span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="row mt-4">
            <div className="col-12">
              <div
                className="card shadow-sm border-start border-4"
                style={{
                  borderStartColor: currentTheme.info,
                  backgroundColor: currentTheme.cardBg,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: "10px",
                }}
              >
                <div
                  className="card-body p-3"
                  style={{
                    backgroundColor: isDarkMode ? currentTheme.cardBg : "#fff",
                  }}
                >
                  <h5 className="mb-2" style={{ color: currentTheme.text }}>
                    <i className="bi bi-lightbulb me-2 text-warning"></i> Daily
                    Tip
                  </h5>
                  <p className="mb-0" style={{ color: currentTheme.mutedText }}>
                    Success starts with consistency—tackle your daily tasks at
                    the same time each day, and celebrate every small win. Each
                    step forward fuels your momentum!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ToastContainer position="bottom-right" />

        <style jsx>{`
          .dashboard-container {
            min-height: 100vh;
          }

          .card {
            border-radius: 10px;
            border: none;
          }

          .card-header {
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
          }

          .task-list .card {
            transition: all 0.3s ease-in-out;
            border: none;
            overflow: hidden;
          }

          .task-list .card:hover {
            transform: translateY(-2px);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
          }

          @media (max-width: 576px) {
            .btn-group {
              flex-wrap: wrap;
            }
            .btn-group .btn {
              flex: 1 0 auto;
              margin-bottom: 5px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default DailyPlanner;
