import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../../components/Sidebar";
import { IoRefreshSharp } from "react-icons/io5";
import { FaTasks } from "react-icons/fa";
import { MdTaskAlt, MdCallMissedOutgoing } from "react-icons/md";
import { IoCodeWorking } from "react-icons/io5";
import { BsApp } from "react-icons/bs";
import { CiClock2 } from "react-icons/ci";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import moment from "moment";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
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

  // Rest of your existing state variables
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    ongoing: 0,
    upcoming: 0,
    overdue: 0,
  });
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showEditReminderForm, setShowEditReminderForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    text: "",
    date: moment().add(1, "day").format("YYYY-MM-DD"),
    time: "09:00", // Default time (9:00 AM)
    status: "INCOMPLETE",
    description: "",
  });
  const [currentReminder, setCurrentReminder] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const [quote, setQuote] = useState({ text: "", author: "" });

  const navigate = useNavigate();
  const pomodoroInterval = useRef(null);

  const token = localStorage.getItem("token");

  // Add this state for weekly chart data
  const [weeklyChartData, setWeeklyChartData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Tasks Completed",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: isDarkMode
          ? "rgba(77, 182, 172, 0.6)"
          : "rgba(75, 192, 192, 0.6)",
        borderColor: isDarkMode
          ? "rgba(77, 182, 172, 1)"
          : "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  });

  // Fetch all necessary data when component mounts
  useEffect(() => {
    if (!token) {
      toast.error("Please login to access the dashboard");
      navigate("/login");
      return;
    }

    fetchDashboardData();
    fetchQuoteOfTheDay();

    loadSettings();
    fetchReminders(); // Add this line to fetch reminders

    // Mock recent activities - replace with real data if available
    setRecentActivities([
      {
        id: 1,
        type: "task_completed",
        text: 'Completed "Project Proposal"',
        timestamp: "2 hours ago",
      },
      {
        id: 2,
        type: "task_added",
        text: 'Added "Research competitor analysis"',
        timestamp: "Yesterday",
      },
      {
        id: 3,
        type: "pomodoro_completed",
        text: "Completed 4 Pomodoro sessions",
        timestamp: "Yesterday",
      },
      {
        id: 4,
        type: "matrix_updated",
        text: "Updated Eisenhower Matrix",
        timestamp: "2 days ago",
      },
    ]);

    return () => {
      if (pomodoroInterval.current) {
        clearInterval(pomodoroInterval.current);
      }
    };
  }, [token, navigate]);

  // Load user settings from localStorage
  const loadSettings = () => {
    const savedPomodoroSettings = localStorage.getItem("pomodoroSettings");
    if (savedPomodoroSettings) {
      const settings = JSON.parse(savedPomodoroSettings);
      setPomodoroTime(settings.pomodoro || 25 * 60);
    }

    // Load saved reminders
    const savedReminders = localStorage.getItem("dashboardReminders");
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
  };

  // Add this function to format relative time for activities
  const getRelativeTimeString = (date) => {
    const now = new Date();
    const taskDate = new Date(date);
    const diffInHours = Math.floor((now - taskDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    if (diffInHours < 48) return "Yesterday";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return taskDate.toLocaleDateString();
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch tasks
      const tasksResponse = await axios.get("http://localhost:8080/getTask", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch completed tasks
      const completedResponse = await axios.get(
        "http://localhost:8080/getCompletedTask",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const allTasks = [...tasksResponse.data];
      const completedTasks = [...completedResponse.data];

      // Process tasks for stats
      const now = new Date();
      const ongoing = allTasks.filter((task) => task.status === "ONGOING");
      const upcoming = allTasks.filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate > now && task.status !== "Completed";
      });
      const overdue = allTasks.filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate < now && task.status !== "Completed";
      });

      setTasks([...allTasks, ...completedTasks]);
      setStats({
        total: allTasks.length + completedTasks.length,
        completed: completedTasks.length,
        ongoing: ongoing.length,
        upcoming: upcoming.length,
        overdue: overdue.length,
      });

      // Generate activity data from completed tasks
      const activities = completedTasks
        .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
        .slice(0, 5)
        .map((task, index) => ({
          id: task.id,
          type: "task_completed",
          text: `Completed "${task.title}"`,
          timestamp: getRelativeTimeString(task.dueDate),
          date: task.dueDate,
        }));

      // Add some additional activities if needed to have a variety
      if (activities.length > 0) {
        setRecentActivities(activities);
      }

      // Get calendar events
      loadCalendarEvents();

      // Process tasks for weekly chart data
      generateWeeklyChartData(completedTasks);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Load calendar events from localStorage
  const loadCalendarEvents = () => {
    try {
      const savedEvents = localStorage.getItem("calendarEvents");
      if (savedEvents) {
        const events = JSON.parse(savedEvents);

        // Get only upcoming events for the next 5 days
        const today = new Date();
        const fiveDaysLater = new Date();
        fiveDaysLater.setDate(today.getDate() + 5);

        const upcomingEvents = events
          .filter((event) => {
            const eventDate = new Date(event.start);
            return eventDate >= today && eventDate <= fiveDaysLater;
          })
          .sort((a, b) => new Date(a.start) - new Date(b.start))
          .slice(0, 5); // Take only first 5 events

        setCalendarEvents(upcomingEvents);
      }
    } catch (error) {
      console.error("Error loading calendar events:", error);
    }
  };

  // Replace the fetchQuoteOfTheDay function with this hardcoded solution:
  const fetchQuoteOfTheDay = () => {
    // Hardcoded quotes collection
    const quotes = [
      {
        text: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
      },
      {
        text: "Don't watch the clock; do what it does. Keep going.",
        author: "Sam Levenson",
      },
      {
        text: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney",
      },
      {
        text: "It always seems impossible until it's done.",
        author: "Nelson Mandela",
      },
      {
        text: "Start where you are. Use what you have. Do what you can.",
        author: "Arthur Ashe",
      },
      {
        text: "Your time is limited, don't waste it living someone else's life.",
        author: "Steve Jobs",
      },
      {
        text: "Either you run the day or the day runs you.",
        author: "Jim Rohn",
      },
      {
        text: "You don't have to be great to start, but you have to start to be great.",
        author: "Zig Ziglar",
      },
      {
        text: "The future depends on what you do today.",
        author: "Mahatma Gandhi",
      },
      {
        text: "Focus on being productive instead of busy.",
        author: "Tim Ferriss",
      },
      {
        text: "The most difficult thing is the decision to act, the rest is merely tenacity.",
        author: "Amelia Earhart",
      },
      { text: "Work smarter, not harder.", author: "Allen F. Morgenstern" },
    ];

    // Select a random quote from the collection
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote({
      text: randomQuote.text,
      author: randomQuote.author,
    });
  };

  // Handle pomodoro timer
  const togglePomodoro = () => {
    if (isRunning) {
      clearInterval(pomodoroInterval.current);
      setIsRunning(false);
    } else {
      pomodoroInterval.current = setInterval(() => {
        setPomodoroTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(pomodoroInterval.current);
            setIsRunning(false);
            toast.success("Pomodoro session completed!");
            return 25 * 60; // Reset to 25 minutes
          }
          return prevTime - 1;
        });
      }, 1000);
      setIsRunning(true);
    }
  };

  // Format time from seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Add fetchReminders function
  const fetchReminders = async () => {
    try {
      // Replace with your actual backend URL
      const response = await fetch("http://localhost:8080/getReminder", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      } else {
        console.error("Failed to fetch reminders");
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast.error("Error fetching reminders");
    }
  };

  // Update the formatTimeForBackend function to properly handle time formatting
  const formatTimeForBackend = (timeString) => {
    try {
      // Make sure we have a valid time string
      if (!timeString || timeString.indexOf(":") === -1) {
        // Return a default time if the input is invalid
        return "09:00 AM";
      }

      // Parse the 24-hour format time string "HH:MM" into hours and minutes
      const [hours, minutes] = timeString.split(":").map(Number);

      // Validate hours and minutes
      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        return "09:00 AM";
      }

      // Determine if it's AM or PM
      const period = hours >= 12 ? "PM" : "AM";

      // Convert 24-hour format to 12-hour format
      const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight

      // Format the time string as "hh:mm a" (e.g., "09:00 AM")
      return `${hours12.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "09:00 AM"; // Default fallback
    }
  };

  // Add reminder function
  const addReminder = async () => {
    if (!newReminder.text) {
      toast.error("Please enter reminder title");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/addReminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newReminder.text,
          description: newReminder.description || "No description",
          date: newReminder.date,
          time: formatTimeForBackend(newReminder.time),
          status: newReminder.status,
        }),
      });

      if (response.ok) {
        toast.success("Reminder added successfully");
        setShowReminderForm(false);
        setNewReminder({
          text: "",
          date: moment().add(1, "day").format("YYYY-MM-DD"),
          time: "09:00",
          status: "INCOMPLETE",
          description: "",
        });
        fetchReminders(); // Refresh reminders
      } else {
        const errorData = await response.text();
        toast.error(errorData || "Failed to add reminder");
      }
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast.error("Error adding reminder");
    }
  };

  // Update reminder function with date validation
  const updateReminder = async () => {
    if (!currentReminder || !currentReminder.text) {
      toast.error("Please enter reminder title");
      return;
    }

    // Check if the date is in the future
    if (moment(currentReminder.date).isBefore(moment().startOf("day"))) {
      toast.error("Reminder date should be in the future");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/updateReminder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: currentReminder.id,
          title: currentReminder.text,
          description: currentReminder.description || "No description",
          date: currentReminder.date,
          time: formatTimeForBackend(currentReminder.time),
          status: currentReminder.status,
        }),
      });

      if (response.ok) {
        toast.success("Reminder updated successfully");
        setShowEditReminderForm(false);
        setCurrentReminder(null);
        fetchReminders(); // Refresh reminders
      } else {
        const errorData = await response.text();
        toast.error(errorData || "Failed to update reminder");
      }
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast.error("Error updating reminder");
    }
  };

  // Delete a reminder
  const deleteReminder = async (id) => {
    try {
      // Replace with your actual backend URL
      const response = await fetch(
        `http://localhost:8080/deleteReminder/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Reminder deleted successfully");
        fetchReminders(); // Refresh reminders
      } else {
        toast.error("Failed to delete reminder");
      }
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Error deleting reminder");
    }
  };

  // Toggle reminder completion status
  const toggleReminderStatus = async (reminder) => {
    const updatedStatus =
      reminder.status === "COMPLETED" ? "INCOMPLETE" : "COMPLETED";

    try {
      const response = await fetch("http://localhost:8080/updateReminder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: reminder.id,
          title: reminder.title,
          description: reminder.description || "No description",
          date: reminder.date,
          time: formatTimeForBackend(reminder.time),
          status: updatedStatus,
        }),
      });

      if (response.ok) {
        toast.success(`Reminder marked as ${updatedStatus.toLowerCase()}`);
        fetchReminders(); // Refresh reminders
      } else {
        const errorData = await response.text();
        toast.error(errorData || "Failed to update reminder status");
      }
    } catch (error) {
      console.error("Error updating reminder status:", error);
      toast.error("Error updating reminder status");
    }
  };

  // Open edit reminder form
  const openEditReminderForm = (reminder) => {
    setCurrentReminder({
      id: reminder.id,
      text: reminder.title,
      description: reminder.description,
      date: reminder.date,
      time: reminder.time, // Include time field
      status: reminder.status,
    });
    setShowEditReminderForm(true);
  };

  // Filter upcoming reminders
  const upcomingReminders = reminders.filter(
    (rem) => rem.status !== "COMPLETED"
  );

  // Adjust chart colors based on theme
  const getChartColors = () => {
    if (isDarkMode) {
      return {
        completed: "rgba(77, 182, 172, 0.8)", // success - teal
        ongoing: "rgba(41, 121, 255, 0.8)", // info - blue
        upcoming: "rgba(255, 213, 79, 0.8)", // warning - gold
        overdue: "rgba(255, 107, 107, 0.8)", // danger - coral
        border: {
          completed: "rgba(77, 182, 172, 1)",
          ongoing: "rgba(41, 121, 255, 1)",
          upcoming: "rgba(255, 213, 79, 1)",
          overdue: "rgba(255, 107, 107, 1)",
        },
      };
    } else {
      return {
        completed: "rgba(75, 192, 192, 0.6)",
        ongoing: "rgba(54, 162, 235, 0.6)",
        upcoming: "rgba(255, 206, 86, 0.6)",
        overdue: "rgba(255, 99, 132, 0.6)",
        border: {
          completed: "rgba(75, 192, 192, 1)",
          ongoing: "rgba(54, 162, 235, 1)",
          upcoming: "rgba(255, 206, 86, 1)",
          overdue: "rgba(255, 99, 132, 1)",
        },
      };
    }
  };

  // Add this function to generate weekly chart data
  const generateWeeklyChartData = (completedTasks) => {
    // Get date for the start of the current week (Monday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const startOfWeek = new Date(today);
    // Adjust to get Monday (or Sunday if you prefer week starting on Sunday)
    startOfWeek.setDate(
      today.getDate() - ((currentDay === 0 ? 7 : currentDay) - 1)
    );
    startOfWeek.setHours(0, 0, 0, 0);

    // Initialize counts for each day of the week
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon to Sun

    // Count tasks completed each day of the current week
    completedTasks.forEach((task) => {
      if (!task.dueDate) return;

      const taskDate = new Date(task.dueDate);
      // Check if the task was completed this week
      if (taskDate >= startOfWeek && taskDate <= today) {
        const dayOfWeek = taskDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
        // Convert to index in our array (0 = Monday, 6 = Sunday)
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        dayCounts[dayIndex]++;
      }
    });

    // Update chart data
    setWeeklyChartData({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Tasks Completed",
          data: dayCounts,
          backgroundColor: isDarkMode
            ? "rgba(77, 182, 172, 0.6)"
            : "rgba(75, 192, 192, 0.6)",
          borderColor: isDarkMode
            ? "rgba(77, 182, 172, 1)"
            : "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    });
  };

  // Make sure weeklyChartData updates when theme changes
  useEffect(() => {
    // Update chart colors when theme changes
    setWeeklyChartData((prevData) => ({
      ...prevData,
      datasets: [
        {
          ...prevData.datasets[0],
          backgroundColor: isDarkMode
            ? "rgba(77, 182, 172, 0.6)"
            : "rgba(75, 192, 192, 0.6)",
          borderColor: isDarkMode
            ? "rgba(77, 182, 172, 1)"
            : "rgba(75, 192, 192, 1)",
        },
      ],
    }));
  }, [isDarkMode]);

  // Update the statusChartData with themed colors
  const chartColors = getChartColors();
  const statusChartData = {
    labels: ["Completed", "Ongoing", "Upcoming", "Overdue"],
    datasets: [
      {
        label: "Tasks",
        data: [stats.completed, stats.ongoing, stats.upcoming, stats.overdue],
        backgroundColor: [
          chartColors.completed,
          chartColors.ongoing,
          chartColors.upcoming,
          chartColors.overdue,
        ],
        borderColor: [
          chartColors.border.completed,
          chartColors.border.ongoing,
          chartColors.border.upcoming,
          chartColors.border.overdue,
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className={`d-flex `}>
      <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <div
        className="dashboard-container flex-grow-1 p-3 p-md-4"
        style={{
          backgroundColor: currentTheme.background,
          color: currentTheme.text,
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        {/* Header section */}
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
                <i className="bi bi-grid-1x2-fill me-2"></i> Dashboard
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

            <div className="d-flex align-items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-sm"
                onClick={fetchDashboardData}
                style={{
                  backgroundColor: isDarkMode ? "transparent" : "transparent",
                  color: currentTheme.primary,
                  border: `1px solid ${currentTheme.primary}`,
                }}
              >
                <IoRefreshSharp className="me-1" /> Refresh
              </motion.button>
            </div>
          </div>

          {/* Greeting and date */}
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

        {/* Stats cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4 col-lg-2">
            <motion.div
              className="stat-card h-100 rounded shadow-sm p-3"
              whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="d-flex align-items-center mb-2">
                <div
                  className="stat-icon"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(74,111,165,0.2)"
                      : "rgba(74,111,165,0.1)",
                    color: currentTheme.primary,
                  }}
                >
                  <FaTasks />
                </div>
                <h6 className="ms-2 mb-0" style={{ color: currentTheme.text }}>
                  Total Tasks
                </h6>
              </div>
              <h3 className="mb-0 mt-2" style={{ color: currentTheme.primary }}>
                {stats.total}
              </h3>
            </motion.div>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <motion.div
              className="stat-card h-100 rounded shadow-sm p-3"
              whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="d-flex align-items-center mb-2">
                <div
                  className="stat-icon"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(77,182,172,0.2)"
                      : "rgba(77,182,172,0.1)",
                    color: currentTheme.success,
                  }}
                >
                  <MdTaskAlt />
                </div>
                <h6 className="ms-2 mb-0" style={{ color: currentTheme.text }}>
                  Completed
                </h6>
              </div>
              <h3 className="mb-0 mt-2" style={{ color: currentTheme.success }}>
                {stats.completed}
              </h3>
            </motion.div>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <motion.div
              className="stat-card h-100 rounded shadow-sm p-3"
              whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="d-flex align-items-center mb-2">
                <div
                  className="stat-icon"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(41,121,255,0.2)"
                      : "rgba(41,121,255,0.1)",
                    color: currentTheme.info,
                  }}
                >
                  <IoCodeWorking />
                </div>
                <h6 className="ms-2 mb-0" style={{ color: currentTheme.text }}>
                  Ongoing
                </h6>
              </div>
              <h3 className="mb-0 mt-2" style={{ color: currentTheme.info }}>
                {stats.ongoing}
              </h3>
            </motion.div>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <motion.div
              className="stat-card h-100 rounded shadow-sm p-3"
              whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="d-flex align-items-center mb-2">
                <div
                  className="stat-icon"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(255,213,79,0.2)"
                      : "rgba(255,213,79,0.1)",
                    color: currentTheme.warning,
                  }}
                >
                  <BsApp />
                </div>
                <h6 className="ms-2 mb-0" style={{ color: currentTheme.text }}>
                  Upcoming
                </h6>
              </div>
              <h3 className="mb-0 mt-2" style={{ color: currentTheme.warning }}>
                {stats.upcoming}
              </h3>
            </motion.div>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <motion.div
              className="stat-card h-100 rounded shadow-sm p-3"
              whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="d-flex align-items-center mb-2">
                <div
                  className="stat-icon"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(255,107,107,0.2)"
                      : "rgba(255,107,107,0.1)",
                    color: currentTheme.danger,
                  }}
                >
                  <MdCallMissedOutgoing />
                </div>
                <h6 className="ms-2 mb-0" style={{ color: currentTheme.text }}>
                  Overdue
                </h6>
              </div>
              <h3 className="mb-0 mt-2" style={{ color: currentTheme.danger }}>
                {stats.overdue}
              </h3>
            </motion.div>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <motion.div
              className="stat-card h-100 rounded shadow-sm p-3"
              whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <div className="d-flex align-items-center mb-2">
                <div
                  className="stat-icon"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(126,87,194,0.2)"
                      : "rgba(126,87,194,0.1)",
                    color: currentTheme.accent,
                  }}
                >
                  <CiClock2 />
                </div>
                <h6 className="ms-2 mb-0" style={{ color: currentTheme.text }}>
                  Reminders
                </h6>
              </div>
              <h3 className="mb-0 mt-2" style={{ color: currentTheme.accent }}>
                {upcomingReminders.length}
              </h3>
            </motion.div>
          </div>
        </div>

        {/* Main dashboard content */}
        <div className="row g-3">
          {/* Left column */}
          <div className="col-md-8">
            {/* Task overview chart */}
            <div
              className="card shadow-sm mb-3"
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "10px",
              }}
            >
              <div
                className="card-header d-flex justify-content-between align-items-center"
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
                  <i className="bi bi-pie-chart-fill me-2"></i> Task Overview
                </h5>
                <div className="btn-group btn-group-sm">
                  <Link
                    to="/homepage"
                    className="btn"
                    style={{
                      backgroundColor: "transparent",
                      color: currentTheme.primary,
                      borderColor: currentTheme.primary,
                    }}
                  >
                    View All Tasks
                  </Link>
                </div>
              </div>
              <div className="card-body" style={{ color: currentTheme.text }}>
                <div className="row">
                  <div className="col-md-5">
                    <div
                      className="chart-container"
                      style={{ height: "220px" }}
                    >
                      <Doughnut
                        data={statusChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: {
                                color: currentTheme.text,
                                font: {
                                  size: 12,
                                },
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-7">
                    <div
                      className="chart-container"
                      style={{ height: "220px" }}
                    >
                      <Bar
                        data={weeklyChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            title: {
                              display: true,
                              text: "Weekly Task Completion",
                              color: currentTheme.text,
                            },
                          },
                          scales: {
                            x: {
                              ticks: {
                                color: currentTheme.mutedText,
                              },
                              grid: {
                                color: isDarkMode
                                  ? "rgba(255, 255, 255, 0.1)"
                                  : "rgba(0, 0, 0, 0.1)",
                              },
                            },
                            y: {
                              ticks: {
                                color: currentTheme.mutedText,
                              },
                              grid: {
                                color: isDarkMode
                                  ? "rgba(255, 255, 255, 0.1)"
                                  : "rgba(0, 0, 0, 0.1)",
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming tasks */}
            <div
              className="card shadow-sm mb-3"
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "10px",
              }}
            >
              <div
                className="card-header d-flex justify-content-between align-items-center"
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
                  <i className="bi bi-calendar-check me-2"></i> Upcoming Tasks
                </h5>
                <Link
                  to="/homepage"
                  className="btn btn-sm"
                  style={{
                    backgroundColor: "transparent",
                    color: currentTheme.primary,
                    borderColor: currentTheme.primary,
                  }}
                >
                  View All
                </Link>
              </div>
              <div className="card-body p-0">
                {tasks
                  .filter((task) => task.status !== "Completed")
                  .sort((a, b) =>
                    a.dueDate ? new Date(a.dueDate) - new Date(b.dueDate) : 1
                  )
                  .slice(0, 5)
                  .map((task, index) => (
                    <motion.div
                      key={task.id}
                      className={`task-item p-3 ${
                        index !== 0 ? "border-top" : ""
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{
                        backgroundColor: isDarkMode
                          ? currentTheme.headerBg
                          : "#f8f9fa",
                      }}
                      style={{
                        borderTop:
                          index !== 0
                            ? `1px solid ${currentTheme.border}`
                            : "none",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6
                            className="mb-1"
                            style={{ color: currentTheme.text }}
                          >
                            {task.title}
                          </h6>
                          <p
                            className="mb-0 small"
                            style={{ color: currentTheme.mutedText }}
                          >
                            {task.description
                              ? task.description.length > 60
                                ? task.description.substring(0, 60) + "..."
                                : task.description
                              : "No description"}
                          </p>

                          <div className="d-flex align-items-center mt-2">
                            <span
                              className={`badge me-2`}
                              style={{
                                backgroundColor:
                                  task.priority === "High"
                                    ? isDarkMode
                                      ? "rgba(255,107,107,0.2)"
                                      : "#f8d7da"
                                    : task.priority === "Medium"
                                    ? isDarkMode
                                      ? "rgba(255,213,79,0.2)"
                                      : "#fff3cd"
                                    : isDarkMode
                                    ? "rgba(77,182,172,0.2)"
                                    : "#d1e7dd",
                                color:
                                  task.priority === "High"
                                    ? isDarkMode
                                      ? "#FF6B6B"
                                      : "#842029"
                                    : task.priority === "Medium"
                                    ? isDarkMode
                                      ? "#FFD54F"
                                      : "#664d03"
                                    : isDarkMode
                                    ? "#4DB6AC"
                                    : "#0f5132",
                              }}
                            >
                              {task.priority || "Low"}
                            </span>

                            <span
                              className={`badge`}
                              style={{
                                backgroundColor:
                                  task.status === "Completed"
                                    ? isDarkMode
                                      ? "rgba(77,182,172,0.2)"
                                      : "#d1e7dd"
                                    : task.status === "ONGOING"
                                    ? isDarkMode
                                      ? "rgba(41,121,255,0.2)"
                                      : "#cfe2ff"
                                    : isDarkMode
                                    ? "rgba(176,190,197,0.2)"
                                    : "#e9ecef",
                                color:
                                  task.status === "Completed"
                                    ? isDarkMode
                                      ? "#4DB6AC"
                                      : "#0f5132"
                                    : task.status === "ONGOING"
                                    ? isDarkMode
                                      ? "#2979FF"
                                      : "#084298"
                                    : isDarkMode
                                    ? "#B0BEC5"
                                    : "#495057",
                              }}
                            >
                              {task.status || "Not Started"}
                            </span>
                          </div>
                        </div>

                        {task.dueDate && (
                          <div className="text-end">
                            <div
                              style={{
                                color:
                                  new Date(task.dueDate) < new Date()
                                    ? currentTheme.danger
                                    : currentTheme.mutedText,
                              }}
                            >
                              <i className="bi bi-calendar-event me-1"></i>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            {new Date(task.dueDate) < new Date() && (
                              <span
                                className="badge mt-1"
                                style={{
                                  backgroundColor: isDarkMode
                                    ? "rgba(255,107,107,0.2)"
                                    : "#f8d7da",
                                  color: isDarkMode ? "#FF6B6B" : "#842029",
                                }}
                              >
                                Overdue
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                {tasks.filter((task) => task.status !== "Completed").length ===
                  0 && (
                  <div
                    className="text-center p-4"
                    style={{ color: currentTheme.mutedText }}
                  >
                    <i
                      className="bi bi-check-all display-4"
                      style={{ color: currentTheme.success }}
                    ></i>
                    <p
                      className="mt-3 mb-0"
                      style={{ color: currentTheme.text }}
                    >
                      You're all caught up!
                    </p>
                    <small>No pending tasks</small>
                  </div>
                )}
              </div>
            </div>

            {/* Recent activities */}
            <div
              className="card shadow-sm"
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "10px",
              }}
            >
              <div
                className="card-header"
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
                  <i className="bi bi-activity me-2"></i> Recent Activities
                </h5>
              </div>
              <div className="card-body p-0">
                {recentActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`activity-item p-3`}
                    style={{
                      borderTop:
                        index !== 0
                          ? `1px solid ${currentTheme.border}`
                          : "none",
                      borderBottom:
                        index === recentActivities.length - 1
                          ? "none"
                          : undefined,
                    }}
                  >
                    <div className="d-flex">
                      <div
                        className={`activity-icon`}
                        style={{
                          backgroundColor: isDarkMode
                            ? currentTheme.headerBg
                            : "#f8f9fa",
                          color:
                            activity.type === "task_completed"
                              ? currentTheme.success
                              : activity.type === "task_added"
                              ? currentTheme.info
                              : activity.type === "pomodoro_completed"
                              ? currentTheme.danger
                              : currentTheme.accent,
                        }}
                      >
                        {activity.type === "task_completed" && (
                          <i className="bi bi-check-circle"></i>
                        )}
                        {activity.type === "task_added" && (
                          <i className="bi bi-plus-circle"></i>
                        )}
                        {activity.type === "pomodoro_completed" && (
                          <i className="bi bi-stopwatch"></i>
                        )}
                        {activity.type === "matrix_updated" && (
                          <i className="bi bi-grid-3x3"></i>
                        )}
                      </div>
                      <div className="ms-3">
                        <p
                          className="mb-0"
                          style={{ color: currentTheme.text }}
                        >
                          {activity.text}
                        </p>
                        <small style={{ color: currentTheme.mutedText }}>
                          {activity.timestamp}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col-md-4">
            {/* Pomodoro mini widget */}
            <motion.div
              className="card shadow-sm mb-3"
              whileHover={{ boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "10px",
              }}
            >
              <div
                className="card-header d-flex justify-content-between align-items-center"
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
                  <i className="bi bi-stopwatch me-2"></i> Pomodoro Timer
                </h5>
                <Link
                  to="/pomodoro_clock"
                  className="btn btn-sm"
                  style={{
                    backgroundColor: "transparent",
                    color: currentTheme.primary,
                    borderColor: currentTheme.primary,
                  }}
                >
                  Full Timer
                </Link>
              </div>
              <div className="card-body text-center">
                <div className="pomodoro-mini-timer mb-3">
                  <h2
                    className="display-4 mb-0"
                    style={{
                      color: isRunning
                        ? currentTheme.danger
                        : currentTheme.text,
                    }}
                  >
                    {formatTime(pomodoroTime)}
                  </h2>
                  <p style={{ color: currentTheme.mutedText }}>
                    {isRunning ? "Focus time..." : "Ready to focus?"}
                  </p>
                </div>

                <div className="d-flex justify-content-center gap-2">
                  <button
                    className={`btn`}
                    onClick={togglePomodoro}
                    style={{
                      backgroundColor: isRunning
                        ? currentTheme.danger
                        : currentTheme.success,
                      color: "#FFFFFF",
                      border: "none",
                    }}
                  >
                    {isRunning ? (
                      <>
                        <i className="bi bi-pause-fill"></i> Pause
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-fill"></i> Start
                      </>
                    )}
                  </button>

                  {isRunning && (
                    <button
                      className="btn"
                      onClick={() => {
                        clearInterval(pomodoroInterval.current);
                        setPomodoroTime(25 * 60);
                        setIsRunning(false);
                      }}
                      style={{
                        backgroundColor: "transparent",
                        color: currentTheme.secondary,
                        borderColor: currentTheme.secondary,
                      }}
                    >
                      <i className="bi bi-arrow-counterclockwise"></i> Reset
                    </button>
                  )}
                </div>

                {!currentTask && !isRunning && (
                  <div className="mt-3">
                    <select
                      className="form-select form-select-sm"
                      value={currentTask ? currentTask.id : ""}
                      onChange={(e) => {
                        const taskId = e.target.value;
                        if (taskId) {
                          const task = tasks.find(
                            (t) => t.id.toString() === taskId
                          );
                          setCurrentTask(task);
                        } else {
                          setCurrentTask(null);
                        }
                      }}
                      style={{
                        backgroundColor: isDarkMode
                          ? currentTheme.headerBg
                          : "#F9FAFB",
                        color: currentTheme.text,
                        borderColor: currentTheme.border,
                      }}
                    >
                      <option value="">Select task to focus on...</option>
                      {tasks
                        .filter((task) => task.status !== "Completed")
                        .map((task) => (
                          <option key={task.id} value={task.id}>
                            {task.title}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {currentTask && (
                  <div
                    className="current-task mt-2 p-2 rounded"
                    style={{
                      backgroundColor: isDarkMode
                        ? currentTheme.headerBg
                        : "#f8f9fa",
                      color: currentTheme.text,
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <small style={{ color: currentTheme.mutedText }}>
                        Currently focusing on:
                      </small>
                      <button
                        className="btn btn-sm btn-link p-0"
                        onClick={() => setCurrentTask(null)}
                        style={{ color: currentTheme.danger }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                    <p className="mb-0 text-truncate fw-medium">
                      {currentTask.title}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Calendar mini widget */}
            <div
              className="card shadow-sm mb-3"
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "10px",
              }}
            >
              <div
                className="card-header d-flex justify-content-between align-items-center"
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
                  <i className="bi bi-calendar3 me-2"></i> Upcoming Events
                </h5>
                <Link
                  to="/calendar"
                  className="btn btn-sm"
                  style={{
                    backgroundColor: "transparent",
                    color: currentTheme.primary,
                    borderColor: currentTheme.primary,
                  }}
                >
                  Full Calendar
                </Link>
              </div>
              <div className="card-body p-0">
                {calendarEvents.length > 0 ? (
                  <div className="upcoming-events">
                    {calendarEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className={`calendar-event-item p-3`}
                        style={{
                          borderTop:
                            index !== 0
                              ? `1px solid ${currentTheme.border}`
                              : "none",
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <div
                            className="event-dot me-2 mt-1"
                            style={{
                              backgroundColor: event.color || "#4DB6AC",
                            }}
                          ></div>
                          <div>
                            <h6
                              className="mb-1"
                              style={{ color: currentTheme.text }}
                            >
                              {event.title}
                            </h6>
                            <p
                              className="mb-0 small"
                              style={{ color: currentTheme.mutedText }}
                            >
                              {moment(event.start).format("MMM D, h:mm A")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-center p-4"
                    style={{ color: currentTheme.mutedText }}
                  >
                    <i className="bi bi-calendar-x display-4"></i>
                    <p
                      className="mt-3 mb-0"
                      style={{ color: currentTheme.text }}
                    >
                      No upcoming events
                    </p>
                    <Link
                      to="/calendar"
                      className="btn btn-sm mt-2"
                      style={{
                        backgroundColor: currentTheme.primary,
                        color: "#FFFFFF",
                        border: "none",
                      }}
                    >
                      Schedule an event
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Reminders */}
            <div
              className="card shadow-sm mb-3"
              style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "10px",
              }}
            >
              <div
                className="card-header d-flex justify-content-between align-items-center"
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
                  <i className="bi bi-bell me-2"></i> Reminders
                </h5>
                <button
                  className="btn btn-sm"
                  onClick={() => setShowReminderForm(true)}
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: "#FFFFFF",
                    border: "none",
                  }}
                >
                  <i className="bi bi-plus"></i> Add
                </button>
              </div>
              <div className="card-body p-0">
                <AnimatePresence>
                  {showReminderForm && (
                    <motion.div
                      className="p-3 border-bottom"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        borderBottom: `1px solid ${currentTheme.border}`,
                        backgroundColor: isDarkMode
                          ? currentTheme.headerBg
                          : "#f8f9fa",
                      }}
                    >
                      <div className="mb-3">
                        <label
                          className="form-label small"
                          style={{ color: currentTheme.text }}
                        >
                          Reminder Title
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter reminder title"
                          value={newReminder.text}
                          onChange={(e) =>
                            setNewReminder({
                              ...newReminder,
                              text: e.target.value,
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

                      <div className="mb-3">
                        <label
                          className="form-label small"
                          style={{ color: currentTheme.text }}
                        >
                          Description
                        </label>
                        <textarea
                          className="form-control"
                          placeholder="Enter description (optional)"
                          value={newReminder.description}
                          onChange={(e) =>
                            setNewReminder({
                              ...newReminder,
                              description: e.target.value,
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

                      <div className="mb-3">
                        <label
                          className="form-label small"
                          style={{ color: currentTheme.text }}
                        >
                          Date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={newReminder.date}
                          onChange={(e) =>
                            setNewReminder({
                              ...newReminder,
                              date: e.target.value,
                            })
                          }
                          min={moment().format("YYYY-MM-DD")}
                          style={{
                            backgroundColor: isDarkMode
                              ? currentTheme.background
                              : "#FFFFFF",
                            color: currentTheme.text,
                            borderColor: currentTheme.border,
                          }}
                        />
                        <small
                          className="text-muted"
                          style={{ color: currentTheme.mutedText }}
                        >
                          Date must be today or in the future
                        </small>
                      </div>

                      <div className="mb-3">
                        <label
                          className="form-label small"
                          style={{ color: currentTheme.text }}
                        >
                          Time
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          value={newReminder.time}
                          onChange={(e) =>
                            setNewReminder({
                              ...newReminder,
                              time: e.target.value,
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

                      <div className="mb-3">
                        <label
                          className="form-label small"
                          style={{ color: currentTheme.text }}
                        >
                          Status
                        </label>
                        <select
                          className="form-select"
                          value={newReminder.status}
                          onChange={(e) =>
                            setNewReminder({
                              ...newReminder,
                              status: e.target.value,
                            })
                          }
                          style={{
                            backgroundColor: isDarkMode
                              ? currentTheme.background
                              : "#FFFFFF",
                            color: currentTheme.text,
                            borderColor: currentTheme.border,
                          }}
                        >
                          <option value="INCOMPLETE">INCOMPLETE</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>

                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm"
                          onClick={() => setShowReminderForm(false)}
                          style={{
                            backgroundColor: "transparent",
                            color: currentTheme.secondary,
                            borderColor: currentTheme.secondary,
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={addReminder}
                          style={{
                            backgroundColor: currentTheme.primary,
                            color: "#FFFFFF",
                            border: "none",
                          }}
                        >
                          Save Reminder
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showEditReminderForm && currentReminder && (
                    <motion.div
                      className="p-3 border-bottom"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        borderBottom: `1px solid ${currentTheme.border}`,
                        backgroundColor: isDarkMode
                          ? currentTheme.headerBg
                          : "#f8f9fa",
                      }}
                    >
                      <div className="mb-3">
                        <label
                          className="form-label small"
                          style={{ color: currentTheme.text }}
                        >
                          Reminder Title
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter reminder title"
                          value={currentReminder.text}
                          onChange={(e) =>
                            setCurrentReminder({
                              ...currentReminder,
                              text: e.target.value,
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

                      <div className="mb-3">
                        <label
                          className="form-label small"
                          style={{ color: currentTheme.text }}
                        >
                          Description
                        </label>
                        <textarea
                          className="form-control"
                          placeholder="Enter description (optional)"
                          value={currentReminder.description}
                          onChange={(e) =>
                            setCurrentReminder({
                              ...currentReminder,
                              description: e.target.value,
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

                      <div className="mb-3">
                        <label
                          className="form-label small"
                          style={{ color: currentTheme.text }}
                        >
                          Date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={currentReminder.date}
                          onChange={(e) =>
                            setCurrentReminder({
                              ...currentReminder,
                              date: e.target.value,
                            })
                          }
                          min={moment().format("YYYY-MM-DD")}
                          style={{
                            backgroundColor: isDarkMode
                              ? currentTheme.background
                              : "#FFFFFF",
                            color: currentTheme.text,
                            borderColor: currentTheme.border,
                          }}
                        />
                        <small
                          className="text-muted"
                          style={{ color: currentTheme.mutedText }}
                        >
                          Date must be today or in the future
                        </small>
                      </div>

                      <div className="mb-3">
                        <label
                          className="form-label small"
                          style={{ color: currentTheme.text }}
                        >
                          Time
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          value={currentReminder.time}
                          onChange={(e) =>
                            setCurrentReminder({
                              ...currentReminder,
                              time: e.target.value,
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

                      <div className="mb-3">
                        <label
                          className="form-label small"
                          style={{ color: currentTheme.text }}
                        >
                          Status
                        </label>
                        <select
                          className="form-select"
                          value={currentReminder.status}
                          onChange={(e) =>
                            setCurrentReminder({
                              ...currentReminder,
                              status: e.target.value,
                            })
                          }
                          style={{
                            backgroundColor: isDarkMode
                              ? currentTheme.background
                              : "#FFFFFF",
                            color: currentTheme.text,
                            borderColor: currentTheme.border,
                          }}
                        >
                          <option value="INCOMPLETE">INCOMPLETE</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>

                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm"
                          onClick={() => setShowEditReminderForm(false)}
                          style={{
                            backgroundColor: "transparent",
                            color: currentTheme.secondary,
                            borderColor: currentTheme.secondary,
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={updateReminder}
                          style={{
                            backgroundColor: currentTheme.primary,
                            color: "#FFFFFF",
                            border: "none",
                          }}
                        >
                          Update Reminder
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {reminders.length > 0 ? (
                  <div className="reminders-list">
                    {reminders.map((reminder, index) => (
                      <motion.div
                        key={reminder.id}
                        className={`reminder-item p-3`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                          borderTop:
                            index !== 0
                              ? `1px solid ${currentTheme.border}`
                              : "none",
                          backgroundColor:
                            reminder.status === "COMPLETED"
                              ? isDarkMode
                                ? "rgba(77,182,172,0.1)"
                                : "rgba(77,182,172,0.05)"
                              : "transparent",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="d-flex">
                            <div
                              className="reminder-icon"
                              style={{
                                backgroundColor:
                                  reminder.status === "COMPLETED"
                                    ? isDarkMode
                                      ? "rgba(77,182,172,0.2)"
                                      : "rgba(77,182,172,0.2)"
                                    : isDarkMode
                                    ? "rgba(255,213,79,0.2)"
                                    : "rgba(255,213,79,0.2)",
                                color:
                                  reminder.status === "COMPLETED"
                                    ? currentTheme.success
                                    : currentTheme.warning,
                                cursor: "pointer",
                              }}
                              onClick={() => toggleReminderStatus(reminder)}
                            >
                              <i
                                className={`bi bi-${
                                  reminder.status === "COMPLETED"
                                    ? "check-circle-fill"
                                    : "circle"
                                }`}
                              ></i>
                            </div>
                            <div
                              className="ms-3"
                              style={{
                                textDecoration:
                                  reminder.status === "COMPLETED"
                                    ? "line-through"
                                    : "none",
                                opacity:
                                  reminder.status === "COMPLETED" ? 0.7 : 1,
                              }}
                            >
                              <p
                                className="mb-0"
                                style={{ color: currentTheme.text }}
                              >
                                {reminder.title}
                              </p>
                              <small style={{ color: currentTheme.mutedText }}>
                                {moment(reminder.date).format("MMM D, YYYY")} at{" "}
                                {reminder.time}
                              </small>
                              {reminder.description &&
                                reminder.description !== "No description" && (
                                  <p
                                    className="mt-1 mb-0 small text-truncate"
                                    style={{
                                      color: currentTheme.mutedText,
                                      maxWidth: "200px",
                                    }}
                                  >
                                    {reminder.description}
                                  </p>
                                )}
                            </div>
                          </div>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm"
                              onClick={() => openEditReminderForm(reminder)}
                              style={{
                                backgroundColor: "transparent",
                                color: currentTheme.info,
                                padding: "4px 8px",
                              }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm"
                              onClick={() => deleteReminder(reminder.id)}
                              style={{
                                backgroundColor: "transparent",
                                color: currentTheme.danger,
                                padding: "4px 8px",
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-center p-4"
                    style={{ color: currentTheme.mutedText }}
                  >
                    <i className="bi bi-bell-slash display-4"></i>
                    <p
                      className="mt-3 mb-0"
                      style={{ color: currentTheme.text }}
                    >
                      No reminders set
                    </p>
                    <button
                      className="btn btn-sm mt-2"
                      onClick={() => setShowReminderForm(true)}
                      style={{
                        backgroundColor: currentTheme.primary,
                        color: "#FFFFFF",
                        border: "none",
                      }}
                    >
                      Add a reminder
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quote of the day */}
            <div
              className="card quote-card shadow-sm text-white mb-3"
              style={{
                background: isDarkMode
                  ? `linear-gradient(45deg, ${currentTheme.accent}, ${currentTheme.primary})`
                  : `linear-gradient(45deg, #4a90e2, #5c6bc0)`,
                borderRadius: "10px",
              }}
            >
              <div className="card-body">
                <i className="bi bi-quote quote-icon"></i>
                <blockquote className="blockquote mb-0">
                  <p>{quote.text}</p>
                  <footer className="blockquote-footer text-white-50">
                    <cite title="Source Title">{quote.author}</cite>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />

      <style jsx>{`
        .dashboard-container {
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

        .task-item:hover,
        .activity-item:hover,
        .calendar-event-item:hover,
        .reminder-item:hover {
          transition: all 0.2s ease;
        }

        .activity-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .event-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .pomodoro-mini-timer {
          border-radius: 10px;
          padding: 10px;
        }

        .reminder-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quote-card {
          position: relative;
          overflow: hidden;
          border-radius: 10px;
        }

        .quote-icon {
          position: absolute;
          top: 10px;
          right: 15px;
          font-size: 4rem;
          opacity: 0.2;
        }

        .due-date {
          font-size: 0.8rem;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .display-4 {
            font-size: 2.5rem;
          }

          .stat-icon {
            width: 32px;
            height: 32px;
            font-size: 1rem;
          }

          .quote-card {
            margin-bottom: 80px; /* Add space at bottom for mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
