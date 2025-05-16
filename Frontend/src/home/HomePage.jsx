import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify"; // Library for showing notification pop-ups
import "react-toastify/dist/ReactToastify.css"; // Styles for notifications
import axios from "axios"; // Library for making HTTP requests to our server
import { motion, AnimatePresence } from "framer-motion"; // Libraries for smooth animations
import Sidebar from "../components/Sidebar"; // Navigation sidebar component
import TaskCard from "./TaskCard"; // Card component to display individual tasks
import TaskForm from "./TaskForm"; // Form component for adding/editing tasks
import { Modal, Button } from "react-bootstrap"; // Pre-styled popup components
import { IoRefreshSharp, IoAddOutline } from "react-icons/io5"; // Icons for refresh and add buttons
import { IoIosSearch } from "react-icons/io"; // Icon for search field
import { useLocation } from "react-router-dom";

const HomePage = () => {
  // Track whether dark mode is on/off (read from saved preferences)
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  // Define color schemes for both light and dark modes
  const theme = {
    light: {
      background: "#F9FAFB", // Very light gray for background
      cardBg: "#FFFFFF", // White for cards
      text: "#333333", // Dark gray for text
      mutedText: "#6c757d", // Medium gray for less important text
      border: "#e0e0e0", // Light gray for borders
      primary: "#4A6FA5", // Slate Blue - main app color
      secondary: "#B0BEC5", // Warm Gray - secondary color
      success: "#4DB6AC", // Light Teal - for success states
      danger: "#FF6B6B", // Bright Coral - for errors/warnings
      warning: "#FFD54F", // Muted Gold - for caution states
      info: "#2979FF", // Electric Blue - for information
      accent: "#7E57C2", // Accent Purple - for highlights
      headerBg: "#FFFFFF", // White for headers
    },
    dark: {
      background: "#263238", // Soft Charcoal for background
      cardBg: "#37474F", // Darker shade for cards
      text: "#E0E0E0", // Light gray for text
      mutedText: "#B0BEC5", // Medium gray for less important text
      border: "#455A64", // Medium-dark gray for borders
      primary: "#4A6FA5", // Same Slate Blue as light mode
      secondary: "#607D8B", // Bluish gray
      success: "#4DB6AC", // Same Light Teal as light mode
      danger: "#FF6B6B", // Same Bright Coral as light mode
      warning: "#FFD54F", // Same Muted Gold as light mode
      info: "#2979FF", // Same Electric Blue as light mode
      accent: "#7E57C2", // Same Accent Purple as light mode
      headerBg: "#1E272C", // Darker than background for headers
    },
  };

  // Select the right color scheme based on current mode
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  // Function to switch between light and dark modes
  const toggleDarkMode = () => {
    const newMode = !isDarkMode; // Flip the current mode
    setIsDarkMode(newMode); // Update the state
    localStorage.setItem("darkMode", newMode.toString()); // Save preference for next visit
  };

  // Load saved dark mode preference when the page first loads
  useEffect(() => {
    const darkModeFromStorage = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeFromStorage);
  }, []);

  // Listen for theme changes from other components
  useEffect(() => {
    // Function that runs when a theme change event is triggered
    const handleThemeChange = (event) => {
      const { isDarkMode: newDarkMode } = event.detail;
      setIsDarkMode(newDarkMode);
    };

    // Start listening for theme change events
    window.addEventListener("themeChanged", handleThemeChange);

    // Stop listening when component unmounts
    return () => {
      window.removeEventListener("themeChanged", handleThemeChange);
    };
  }, []);

  // Main state variables for managing tasks and UI
  const [tasks, setTasks] = useState([]); // All tasks fetched from server
  const [loading, setLoading] = useState(true); // Whether we're loading tasks
  const [showAddModal, setShowAddModal] = useState(false); // Controls "Add Task" popup
  const [showEditModal, setShowEditModal] = useState(false); // Controls "Edit Task" popup
  const [currentTask, setCurrentTask] = useState({
    title: "",
    description: "",
    status: "ONGOING",
    priority: "Medium",
    dueDate: "",
  }); // Task being edited
  const [taskFilter, setTaskFilter] = useState("all"); // Current filter for tasks view
  const [searchQuery, setSearchQuery] = useState(""); // What user is searching for
  const [viewMode, setViewMode] = useState("card"); // Whether to show cards or list view

  // Template for new tasks
  const [newTask, setNewTask] = useState({
    name: "", // Task title/name
    description: "", // Task details
    status: "Ongoing", // Current state (Ongoing, Completed, etc.)
    priority: "Medium", // Importance level
    dueDate: "", // When it's due
    dueTime: "12:00", // What time it's due
  });

  const [showTaskForm, setShowTaskForm] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if the URL contains the openTaskForm parameter
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("openTaskForm") === "true") {
      // Open the task form modal
      setShowAddModal(true);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  // Load tasks when the page first loads
  useEffect(() => {
    fetchTasks();
  }, []);

  // Function to get all tasks from the server
  const fetchTasks = async () => {
    // Get the authentication token stored after login
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to view tasks");
      setLoading(false);
      return;
    }

    try {
      setLoading(true); // Show loading indicator
      // Request tasks from the server
      const response = await axios.get("http://localhost:8080/getTask", {
        headers: { Authorization: `Bearer ${token}` }, // Send token to prove we're logged in
      });

      console.log("Tasks fetched:", response.data);

      // For debugging: Check if we have any tasks with INCOMPLETE status
      const hasIncomplete = response.data?.some(
        (task) => task.status === "INCOMPLETE"
      );
      console.log("Has INCOMPLETE tasks:", hasIncomplete);

      // For debugging: See all the different status values we got
      const uniqueStatuses = [
        ...new Set(response.data?.map((t) => t.status) || []),
      ];
      console.log("Unique status values:", uniqueStatuses);

      // Store the tasks we got from the server
      setTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("No task Exist's. Please try again later.");
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  // Function to add a new task
  const handleAddTaskSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to add tasks");
      return;
    }

    // Validate required fields
    if (!newTask.name) {
      toast.warning("Task name is required");
      return;
    }

    if (!newTask.dueDate) {
      toast.warning("Due date is required");
      return;
    }

    try {
      // Format the task data to match what the server expects
      const taskPayload = {
        title: newTask.name,
        description: newTask.description,
        status:
          newTask.status === "Incomplete"
            ? "INCOMPLETE"
            : newTask.status === "Ongoing"
            ? "ONGOING"
            : newTask.status === "Completed"
            ? "COMPLETED"
            : "INCOMPLETE", // Convert frontend status names to backend format
        priority: newTask.priority.toUpperCase(),
        dueDate: newTask.dueDate,
        time: formatTimeWithAMPM(newTask.dueTime), // Format time with AM/PM
      };

      console.log("Sending task payload:", taskPayload);

      // Send the new task to the server
      const response = await axios.post(
        "http://localhost:8080/addTask",
        taskPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Task added successfully!"); // Show success message
      setShowAddModal(false); // Close the add task popup

      // Reset the new task form
      setNewTask({
        name: "",
        description: "",
        status: "Ongoing",
        priority: "Medium",
        dueDate: "",
        dueTime: "12:00",
      });

      // Note: fetchTasks is commented out to avoid immediate refresh
      // This could be for performance reasons or to implement optimistic UI updates
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error(error.response?.data || "Failed to add task");
    }
  };

  // Function to update an existing task
  const handleUpdateTaskSubmit = async () => {
    if (!currentTask) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to update tasks");
      return;
    }

    // Validate required fields
    if (!currentTask.title && !currentTask.name) {
      toast.warning("Task name/title is required");
      return;
    }

    if (!currentTask.dueDate) {
      toast.warning("Due date is required");
      return;
    }

    try {
      // Format time to include AM/PM as required by the backend
      const formattedTime = currentTask.dueTime
        ? formatTimeWithAMPM(currentTask.dueTime)
        : "12:00 PM"; // Default value

      // Format the task data for the backend
      const taskPayload = {
        id: currentTask.id,
        title: currentTask.name || currentTask.title,
        description: currentTask.description || "",
        status:
          currentTask.status === "Incomplete"
            ? "INCOMPLETE"
            : currentTask.status === "Ongoing"
            ? "ONGOING"
            : currentTask.status === "Completed"
            ? "COMPLETED"
            : currentTask.status, // Convert frontend status to backend format
        priority: currentTask.priority,
        dueDate: currentTask.dueDate,
        time: formattedTime,
      };

      console.log("Update task payload:", taskPayload);

      // Send the updated task to the server
      const response = await axios.put(
        "http://localhost:8080/updateTask",
        taskPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Task updated successfully!");
      setShowEditModal(false); // Close the edit task popup
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error("Error updating task:", error);
      const errorMessage = error.response?.data || "Failed to update task";
      console.log("Error details:", errorMessage);
      toast.error(errorMessage);
    }
  };

  // Helper function to format time to 12-hour format with AM/PM
  const formatTimeWithAMPM = (time) => {
    if (!time) return "12:00 PM"; // Default value

    try {
      // Parse the 24-hour time
      const [hours, minutes] = time.split(":").map(Number);

      // Determine if it's AM or PM
      const period = hours >= 12 ? "PM" : "AM";

      // Convert to 12-hour format (1-12 instead of 0-23)
      let hour12 = hours % 12;
      if (hour12 === 0) hour12 = 12; // 0 should be displayed as 12 in 12-hour format

      // Format WITH leading zeros for hours to match backend's expected format
      return `${hour12.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "12:00 PM"; // Fallback
    }
  };

  // Function to delete a task
  const deleteTask = async (taskId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to delete tasks");
      return;
    }

    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      // Send delete request to the server
      await axios.delete(`http://localhost:8080/deleteTask/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Task deleted successfully!");
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  // Function to quickly change a task's status without opening the edit form
  const handleQuickStatusUpdate = async (task, newStatus) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to update tasks");
      return;
    }

    try {
      // Convert frontend status to backend format
      const backendStatus =
        newStatus === "Incomplete"
          ? "INCOMPLETE"
          : newStatus === "Ongoing"
          ? "ONGOING"
          : newStatus === "Completed"
          ? "COMPLETED"
          : "INCOMPLETE";

      // Create a message based on the new status
      let toastMessage = "";
      if (backendStatus === "COMPLETED") {
        toastMessage = "Task marked as Completed!";
      } else if (backendStatus === "ONGOING") {
        toastMessage = "Task moved to Ongoing!";
      } else {
        toastMessage = "Task reset to Incomplete!";
      }

      // Format the task data for the backend
      const taskPayload = {
        id: task.id,
        title: task.title || task.name,
        description: task.description || "",
        status: backendStatus,
        priority: task.priority,
        dueDate: task.dueDate,
        time: task.time || formatTimeWithAMPM(task.dueTime || "12:00"),
      };

      console.log("Updating task with payload:", taskPayload);

      // Send the updated task to the server
      await axios.put("http://localhost:8080/updateTask", taskPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success(toastMessage);
      await fetchTasks(); // Refresh the tasks list
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  // Helper function to prepare a task for editing in the form
  const prepareTaskForEditing = (task) => {
    // Extract date and time from combined dueDate if needed
    let dueDate = task.dueDate;
    let dueTime = "12:00";

    if (dueDate && dueDate.includes("T")) {
      const dateParts = dueDate.split("T");
      dueDate = dateParts[0];
      dueTime = dateParts[1].substring(0, 5); // Get HH:MM format
    }

    // Convert backend status to frontend format
    let status;
    if (task.status === "ONGOING") status = "Ongoing";
    else if (task.status === "COMPLETED") status = "Completed";
    else if (task.status === "INCOMPLETE") status = "Incomplete";
    else status = task.status || "Incomplete"; // Default to Incomplete

    return {
      id: task.id,
      name: task.title || task.name, // Map title to name for TaskForm
      description: task.description || "",
      status: status,
      priority: task.priority,
      dueDate: dueDate,
      dueTime: dueTime,
    };
  };

  // Function to open the edit task modal
  const handleEditTask = (task) => {
    setCurrentTask(prepareTaskForEditing(task));
    setShowEditModal(true);
  };

  // Function to filter and search tasks
  const getFilteredTasks = () => {
    // Apply only search filtering when using specific API endpoints
    if (taskFilter === "completed") {
      // For completed tasks that came from the CompletedTask API,
      // we only need to apply search filtering
      if (searchQuery) {
        return tasks.filter(
          (task) =>
            task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return tasks;
    }

    // For all other filters, apply the existing filtering logic
    return tasks.filter((task) => {
      // First apply status filter
      if (taskFilter === "all") {
        // When "all" is selected, skip status filtering
      } else if (
        (taskFilter === "ongoing" && task.status !== "ONGOING") ||
        (taskFilter === "INCOMPLETE" && task.status !== "INCOMPLETE") ||
        (taskFilter === "upcoming" &&
          (new Date(task.dueDate) <= new Date() ||
            task.status === "COMPLETED")) ||
        (taskFilter === "overdue" &&
          (new Date(task.dueDate) > new Date() || task.status === "COMPLETED"))
      ) {
        return false;
      }

      // Then apply search query
      if (searchQuery) {
        return (
          task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return true;
    });
  };

  // Function to get CSS class for task status
  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-success"; // Green
      case "ONGOING":
        return "bg-primary"; // Blue
      default:
        return "bg-secondary"; // Gray
    }
  };

  // Function to get CSS class for task priority
  const getPriorityClass = (priority) => {
    switch (priority) {
      case "High":
        return "bg-danger"; // Red
      case "Medium":
        return "bg-warning"; // Yellow
      case "Low":
        return "bg-info"; // Light blue
      default:
        return "bg-secondary"; // Gray
    }
  };

  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Function to check if a task is overdue
  const isOverdue = (task) => {
    return (
      task.dueDate &&
      new Date(task.dueDate) < new Date() && // Due date is in the past
      task.status !== "COMPLETED" // And task is not completed
    );
  };

  // Animation settings for tasks
  const taskVariants = {
    hidden: { opacity: 0, y: 20 }, // Start invisible and below final position
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1, // Stagger based on task index
        duration: 0.4,
        type: "spring",
        stiffness: 100,
      },
    }),
    exit: { opacity: 0, x: -20 }, // Slide out to left when removed
  };

  // Animation for the container holding all tasks
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Animate children with a delay between each
      },
    },
  };

  // Get the filtered tasks based on current filters and search
  const filteredTasks = getFilteredTasks();

  // Helper function to convert backend status to frontend display format
  const convertStatusForTaskCard = (status) => {
    if (!status) return "Incomplete";

    const normalizedStatus = status.toUpperCase();

    switch (normalizedStatus) {
      case "COMPLETED":
        return "Completed";
      case "ONGOING":
        return "Ongoing";
      case "INCOMPLETE":
        return "Incomplete";
      default:
        console.log("Unknown status:", status);
        return status;
    }
  };

  // Function to handle filter button clicks and fetch specific task types
  const handleFilterChange = async (filter) => {
    setTaskFilter(filter);
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to view tasks");
      setLoading(false);
      return;
    }

    try {
      let response;

      // Fetch different tasks based on selected filter
      switch (filter) {
        case "completed":
          // Use dedicated API endpoint for completed tasks
          response = await axios.get("http://localhost:8080/getCompletedTask", {
            headers: { Authorization: `Bearer ${token}` },
          });
          break;
        case "ongoing":
          // Fetch all tasks and filter for ONGOING on frontend
          response = await axios.get("http://localhost:8080/getTask", {
            headers: { Authorization: `Bearer ${token}` },
          });
          response.data = response.data.filter(
            (task) => task.status === "ONGOING"
          );
          break;
        case "INCOMPLETE":
          // Fetch all tasks and filter for INCOMPLETE on frontend
          response = await axios.get("http://localhost:8080/getTask", {
            headers: { Authorization: `Bearer ${token}` },
          });
          response.data = response.data.filter(
            (task) => task.status === "INCOMPLETE"
          );
          break;
        case "all":
        default:
          // Get all tasks
          response = await axios.get("http://localhost:8080/getTask", {
            headers: { Authorization: `Bearer ${token}` },
          });
          break;
      }

      console.log(`${filter} tasks fetched:`, response.data);
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(`Error fetching ${filter} tasks:`, error);
      toast.error(`Failed to fetch ${filter} tasks. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Left side navigation menu */}
      <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main content area */}
      <div
        className="dashboard-container flex-grow-1 p-3 p-md-4"
        style={{
          backgroundColor: currentTheme.background,
          color: currentTheme.text,
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        <div className="container-fluid px-0">
          {/* Header section with title and action buttons */}
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
                  <i className="bi bi-check2-square me-2"></i> Task Management
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
                {/* Refresh button to reload tasks */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-sm"
                  onClick={fetchTasks}
                  style={{
                    backgroundColor: isDarkMode ? "transparent" : "transparent",
                    color: currentTheme.primary,
                    border: `1px solid ${currentTheme.primary}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 12px",
                  }}
                >
                  <IoRefreshSharp size={16} />
                  Refresh
                </motion.button>

                {/* Add new task button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn"
                  onClick={() => setShowAddModal(true)}
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: "#FFFFFF",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 12px",
                  }}
                >
                  <IoAddOutline size={18} />
                  Add New Task
                </motion.button>
              </div>
            </div>

            {/* Display current date */}
            <div className="mt-2 d-flex flex-wrap justify-content-between align-items-center">
              <p style={{ color: currentTheme.mutedText }} className="mb-0">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </header>

          {/* Filters section */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div
                className="card shadow-sm mb-3"
                style={{
                  backgroundColor: currentTheme.cardBg,
                  border: `1px solid ${currentTheme.border}`,
                }}
              >
                <div
                  className="card-header d-flex justify-content-between align-items-center py-2"
                  style={{
                    backgroundColor: isDarkMode
                      ? currentTheme.headerBg
                      : currentTheme.cardBg,
                    borderBottom: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <h5 className="mb-0" style={{ color: currentTheme.text }}>
                    <i className="bi bi-funnel me-2"></i> Task Filters
                  </h5>
                  <div className="d-flex gap-2">
                    {/* Search box for tasks */}
                    <div className="input-group input-group-sm">
                      <span
                        className="input-group-text"
                        style={{
                          backgroundColor: isDarkMode
                            ? currentTheme.background
                            : currentTheme.cardBg,
                          borderColor: currentTheme.border,
                          color: currentTheme.mutedText,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IoIosSearch size={16} />
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-sm"
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
                <div
                  className="card-body py-2"
                  style={{
                    backgroundColor: currentTheme.cardBg,
                  }}
                >
                  {/* Filter buttons for different task statuses */}
                  <div className="btn-group w-100">
                    {[
                      { id: "all", label: "All", color: "#4A6FA5" },
                      {
                        id: "INCOMPLETE",
                        label: "Incomplete",
                        color: "#B0BEC5",
                      },
                      { id: "ongoing", label: "Ongoing", color: "#2979FF" },
                      { id: "completed", label: "Completed", color: "#4DB6AC" },
                      { id: "upcoming", label: "Upcoming", color: "#FFD54F" },
                      { id: "overdue", label: "Overdue", color: "#FF6B6B" },
                    ].map((filter) => (
                      <motion.button
                        key={filter.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn"
                        onClick={() => handleFilterChange(filter.id)}
                        style={{
                          backgroundColor:
                            taskFilter === filter.id
                              ? isDarkMode
                                ? filter.color
                                : filter.color
                              : "transparent",
                          color:
                            taskFilter === filter.id
                              ? filter.id === "INCOMPLETE" ||
                                filter.id === "upcoming"
                                ? "#263238"
                                : "#FFFFFF"
                              : isDarkMode
                              ? currentTheme.text
                              : filter.color,
                          borderColor: filter.color,
                          borderWidth: "1px",
                          borderStyle: "solid",
                          padding: "0.375rem 0.75rem",
                          margin: "0px",
                          transition: "all 0.2s ease",
                          flex: "1 1 auto",
                        }}
                      >
                        {filter.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* View mode toggle (card view or list view) */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body d-flex justify-content-between align-items-center py-2">
                  <h5 className="mb-0">
                    <i className="bi bi-grid-3x3-gap me-2"></i> View Mode
                  </h5>
                  <div className="btn-group">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`btn btn-sm ${
                        viewMode === "card"
                          ? "btn-secondary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setViewMode("card")}
                    >
                      <i className="bi bi-grid me-1"></i> Card View
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`btn btn-sm ${
                        viewMode === "list"
                          ? "btn-secondary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setViewMode("list")}
                    >
                      <i className="bi bi-list me-1"></i> List View
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main task display area */}
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header bg-white py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi bi-list-check me-2"></i> Tasks List
                    </h5>
                    <span className="badge bg-primary rounded-pill">
                      {filteredTasks.length}{" "}
                      {filteredTasks.length === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  {/* Show loader while fetching tasks */}
                  {loading ? (
                    <div className="d-flex justify-content-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    // Show empty state when no tasks match filters
                    <div className="text-center py-5">
                      <i className="bi bi-inbox display-1 text-muted"></i>
                      <p className="mt-3 mb-0">No tasks found</p>
                      <p className="text-muted">
                        {searchQuery
                          ? "Try adjusting your search query"
                          : taskFilter !== "all"
                          ? "Try changing your filter"
                          : "Click 'Add New Task' to create one"}
                      </p>
                    </div>
                  ) : viewMode === "list" ? (
                    // List View Display - tasks in a vertical list
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="task-list"
                    >
                      <AnimatePresence>
                        {filteredTasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            custom={index}
                            variants={taskVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="task-item p-3 border-bottom"
                          >
                            <div className="d-flex align-items-start">
                              <div className="form-check me-3 mt-1">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`task-${task.id}`}
                                  checked={task.status === "COMPLETED"}
                                  onChange={() => {
                                    const updatedTask = {
                                      ...task,
                                      status:
                                        task.status === "COMPLETED"
                                          ? "ONGOING"
                                          : "COMPLETED",
                                    };
                                    setCurrentTask(
                                      prepareTaskForEditing(updatedTask)
                                    );
                                    setShowEditModal(true);
                                  }}
                                  style={{ transform: "scale(1.2)" }}
                                />
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex flex-wrap align-items-center mb-2">
                                  <h5
                                    className="mb-0 me-2"
                                    style={{
                                      textDecoration:
                                        task.status === "COMPLETED"
                                          ? "line-through"
                                          : "none",
                                      opacity:
                                        task.status === "COMPLETED" ? 0.7 : 1,
                                    }}
                                  >
                                    {task.title}
                                  </h5>
                                  <div className="ms-auto d-none d-sm-block">
                                    <span
                                      className={`badge ${getStatusClass(
                                        task.status
                                      )} me-2`}
                                    >
                                      {task.status}
                                    </span>
                                    <span
                                      className={`badge ${getPriorityClass(
                                        task.priority
                                      )} me-2`}
                                    >
                                      {task.priority}
                                    </span>
                                    <span
                                      className={`badge ${
                                        isOverdue(task)
                                          ? "bg-danger"
                                          : "bg-light text-dark"
                                      }`}
                                    >
                                      <i className="bi bi-calendar me-1"></i>
                                      {formatDate(task.dueDate)}
                                    </span>
                                  </div>
                                </div>
                                <p className="mb-2 text-muted">
                                  {task.description
                                    ? task.description.length > 150
                                      ? task.description.substring(0, 150) +
                                        "..."
                                      : task.description
                                    : "No description provided"}
                                </p>

                                {/* Mobile view badges - only shown on small screens */}
                                <div className="d-block d-sm-none mb-2">
                                  <span
                                    className={`badge ${getStatusClass(
                                      task.status
                                    )} me-2`}
                                  >
                                    {task.status}
                                  </span>
                                  <span
                                    className={`badge ${getPriorityClass(
                                      task.priority
                                    )} me-2`}
                                  >
                                    {task.priority}
                                  </span>
                                  <span
                                    className={`badge ${
                                      isOverdue(task)
                                        ? "bg-danger"
                                        : "bg-light text-dark"
                                    }`}
                                  >
                                    <i className="bi bi-calendar me-1"></i>
                                    {formatDate(task.dueDate)}
                                  </span>
                                </div>

                                <div className="task-actions">
                                  <button
                                    className="btn btn-sm btn-outline-primary me-2"
                                    onClick={() => {
                                      setCurrentTask(
                                        prepareTaskForEditing(task)
                                      );
                                      setShowEditModal(true);
                                    }}
                                  >
                                    <i className="bi bi-pencil-square"></i> Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => deleteTask(task.id)}
                                  >
                                    <i className="bi bi-trash"></i> Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    // Card View Display - tasks in a grid of cards
                    <div className="p-3">
                      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                        <AnimatePresence>
                          {filteredTasks.map((task, index) => (
                            <motion.div
                              key={task.id}
                              className="col"
                              custom={index}
                              variants={taskVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                            >
                              <TaskCard
                                task={{
                                  ...task,
                                  status: convertStatusForTaskCard(task.status),
                                }}
                                index={index}
                                handleEditTask={() => handleEditTask(task)}
                                handleDelete={() => deleteTask(task.id)}
                                handleQuickStatusUpdate={(index, newStatus) =>
                                  handleQuickStatusUpdate(task, newStatus)
                                }
                                isDarkMode={isDarkMode} // Pass theme to TaskCard
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Task Modal - Using TaskForm component */}
        <Modal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          backdrop="static"
          centered
          size="lg"
          contentClassName={isDarkMode ? "bg-dark text-light" : ""}
          style={{ borderRadius: "16px" }}
        >
          <div style={{ borderRadius: "12px", overflow: "hidden" }}>
            <TaskForm
              taskData={newTask}
              setTaskData={setNewTask}
              fetchTasks={fetchTasks} // Pass the actual fetchTasks function
              isEditing={false}
              closeForm={() => setShowAddModal(false)}
              isDarkMode={isDarkMode}
            />
          </div>
        </Modal>

        {/* Edit Task Modal - Using TaskForm component */}
        <Modal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          backdrop="static"
          centered
          size="lg"
          contentClassName={isDarkMode ? "bg-dark text-light" : ""}
          style={{ borderRadius: "16px" }}
        >
          <div style={{ borderRadius: "12px", overflow: "hidden" }}>
            <TaskForm
              taskData={currentTask}
              setTaskData={setCurrentTask}
              fetchTasks={handleUpdateTaskSubmit}
              isEditing={true}
              closeForm={() => setShowEditModal(false)}
              isDarkMode={isDarkMode}
            />
          </div>
        </Modal>

        {/* Toast notifications container */}
        <ToastContainer position="bottom-right" />

        {/* CSS styles for the page */}
        <style jsx>{`
          .dashboard-container {
            background-color: #f5f7fa;
            min-height: 100vh;
          }

          .stat-card {
            transition: all 0.3s ease;
            border-radius: 10px;
          }

          .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
          }

          .task-item {
            transition: all 0.3s ease;
          }
          .task-item:hover {
            background-color: #f8f9fa;
          }
          .task-actions {
            margin-top: 10px;
          }

          .card {
            border-radius: 10px;
            border: none;
          }

          .card-header {
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
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

          /* Add this rule to prevent layout shifts */
          html {
            scrollbar-gutter: stable;
            overflow-y: scroll;
          }

          /* Make sure the dashboard container maintains consistent width */
          .dashboard-container {
            width: calc(100% - 250px);
            max-width: 100%;
            overflow-x: hidden;
          }

          /* Ensure consistent grid spacing */
          .row {
            margin-right: 0;
            margin-left: 0;
          }

          /* Additional responsive adjustments */
          @media (max-width: 768px) {
            .dashboard-container {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default HomePage;
