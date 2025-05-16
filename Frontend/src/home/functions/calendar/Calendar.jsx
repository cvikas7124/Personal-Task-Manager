import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import moment from "moment";
import axios from "axios";
import { Link } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import { motion } from "framer-motion";
import TaskForm from "../../TaskForm";
import { Modal } from "react-bootstrap";
import { IoRefreshSharp } from "react-icons/io5";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

// Custom toolbar to make navigation more intuitive
const CustomToolbar = (toolbar) => {
  const isDarkMode = localStorage.getItem("theme") === "dark";

  const goToBack = () => {
    toolbar.onNavigate("PREV");
  };

  const goToNext = () => {
    toolbar.onNavigate("NEXT");
  };

  const goToCurrent = () => {
    toolbar.onNavigate("TODAY");
  };

  const viewNames = {
    month: "Month",
    week: "Week",
    day: "Day",
  };

  return (
    <div
      className={`rbc-toolbar custom-toolbar ${
        isDarkMode ? "dark-toolbar" : ""
      }`}
      style={{ padding: "0.5rem" }} // Add reduced padding
    >
      <div className="rbc-btn-group view-group">
        {toolbar.views.map((view) => (
          <button
            key={view}
            className={`btn btn-sm me-1 py-1 px-2`}
            style={{
              backgroundColor:
                view === toolbar.view
                  ? isDarkMode
                    ? "#4A6FA5"
                    : "#4A6FA5"
                  : "transparent",
              color:
                view === toolbar.view
                  ? "#FFFFFF"
                  : isDarkMode
                  ? "#E0E0E0"
                  : "#4A6FA5",
              border: `1px solid ${isDarkMode ? "#4A6FA5" : "#4A6FA5"}`,
            }}
            onClick={() => toolbar.onView(view)}
          >
            {viewNames[view] || view}
          </button>
        ))}
      </div>

      <div className="rbc-toolbar-label">
        <h5
          className="m-0 fw-bold"
          style={{
            color: isDarkMode ? "#e9ecef" : "#195283",
            fontSize: "1rem", // Slightly smaller font size
          }}
        >
          {toolbar.label}
        </h5>
      </div>

      <div className="rbc-btn-group">
        <button
          className="btn btn-outline-primary btn-sm me-1 py-1 px-2"
          onClick={goToCurrent}
        >
          Today
        </button>
        <button
          className="btn btn-outline-primary btn-sm me-1 py-1 px-2"
          onClick={goToBack}
        >
          <FaChevronLeft />
        </button>
        <button
          className="btn btn-outline-primary btn-sm py-1 px-2"
          onClick={goToNext}
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check both storage keys to ensure compatibility
    return (
      localStorage.getItem("theme") === "dark" ||
      localStorage.getItem("darkMode") === "true"
    );
  });
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
  });

  // State for TaskForm modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState({
    name: "",
    description: "",
    status: "Ongoing",
    priority: "Medium",
    dueDate: "",
    dueTime: "12:00",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Consolidate theme handling - replace the useEffect for theme changes with this:
  useEffect(() => {
    const handleThemeChange = () => {
      // Simplified theme check using a single source of truth
      const newDarkMode =
        localStorage.getItem("darkMode") === "true" ||
        localStorage.getItem("theme") === "dark";
      setIsDarkMode(newDarkMode);
    };

    // Listen for theme changes from different sources
    window.addEventListener("storage", handleThemeChange);
    window.addEventListener("themeChanged", handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleThemeChange);
      window.removeEventListener("themeChanged", handleThemeChange);
    };
  }, []);

  // Load events and tasks on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendarEvents");
    if (savedEvents) {
      try {
        // Convert string dates back to Date objects
        const parsedEvents = JSON.parse(savedEvents).map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));
        setEvents(parsedEvents);

        // Calculate stats
        calculateEventStats(parsedEvents);
      } catch (error) {
        console.error("Error loading saved events:", error);
      }
    }

    // Load tasks
    fetchTasks();
  }, []);

  // Calculate event statistics
  const calculateEventStats = (eventsList) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const todayEvents = eventsList.filter(
      (event) =>
        new Date(event.start) >= today && new Date(event.start) < tomorrow
    ).length;

    setStats({
      total: eventsList.length,
      today: todayEvents,
    });
  };

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  // Fetch all tasks
  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8080/getTask", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedTasks = response.data || [];
      setTasks(fetchedTasks);

      // Also sync tasks as events
      syncTasksToEvents(fetchedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert tasks to events and sync them
  const syncTasksToEvents = (tasksList) => {
    // Remove existing task events
    const regularEvents = events.filter((event) => !event.isTask);

    // Convert tasks to calendar events with better error handling
    const taskEvents = tasksList
      .filter((task) => task.dueDate) // Only tasks with due dates
      .map((task) => {
        try {
          const dueDate = new Date(task.dueDate);
          if (isNaN(dueDate.getTime())) {
            throw new Error("Invalid date");
          }

          // Extract time information if available or use default
          let hours = 12,
            minutes = 0;
          if (task.time) {
            const timeParts = task.time.match(/(\d+):(\d+)\s*([AP]M)/i);
            if (timeParts) {
              hours = parseInt(timeParts[1]);
              if (timeParts[3].toUpperCase() === "PM" && hours < 12)
                hours += 12;
              if (timeParts[3].toUpperCase() === "AM" && hours === 12)
                hours = 0;
              minutes = parseInt(timeParts[2]);
            }
          }

          // Create start date with time component
          const startDate = new Date(dueDate);
          startDate.setHours(hours, minutes);

          // End date is 1 hour after start
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 1);

          return {
            id: `task-${task.id}`,
            title: task.title || "Untitled Task",
            start: startDate,
            end: endDate,
            color: getPriorityColor(task.priority),
            isTask: true,
            taskId: task.id,
            originalTask: task, // Store the original task data
          };
        } catch (error) {
          console.error(`Error processing task ${task.id}:`, error);
          return null; // Skip this task
        }
      })
      .filter(Boolean); // Remove null entries

    // Combine regular events with task events
    const updatedEvents = [...regularEvents, ...taskEvents];
    setEvents(updatedEvents);

    // Update stats
    calculateEventStats(updatedEvents);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "#f44336";
      case "Medium":
        return "#ff9800";
      case "Low":
        return "#4caf50";
      default:
        return "#9e9e9e";
    }
  };

  // Handle slot selection (clicking on calendar date/time)
  const handleSelectSlot = ({ start, end }) => {
    // Format date and time for the TaskForm
    const dueDate = moment(start).format("YYYY-MM-DD");
    const dueTime = moment(start).format("HH:mm");

    // Prepare new task with the selected date/time
    setCurrentTask({
      name: "",
      description: "",
      status: "Ongoing",
      priority: "Medium",
      dueDate: dueDate,
      dueTime: dueTime,
    });

    setIsEditing(false);
    setShowTaskModal(true);
  };

  // Handle event selection (clicking on an existing event)
  const handleSelectEvent = (event) => {
    if (event.isTask) {
      // Find the original task data
      const task = tasks.find((t) => t.id === event.taskId);

      if (task) {
        // Convert task data to TaskForm format
        const dueDate = moment(task.dueDate).format("YYYY-MM-DD");

        // Extract time if available
        let dueTime = "12:00";
        if (task.time) {
          const timeParts = task.time.match(/(\d+):(\d+)\s*([AP]M)/i);
          if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const isPM = timeParts[3].toUpperCase() === "PM";

            // Convert to 24-hour format for input
            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;

            dueTime = `${hours.toString().padStart(2, "0")}:${timeParts[2]}`;
          }
        }

        setCurrentTask({
          id: task.id,
          name: task.title,
          description: task.description || "",
          status:
            task.status === "ONGOING"
              ? "Ongoing"
              : task.status === "COMPLETED"
              ? "Completed"
              : "Incomplete",
          priority: task.priority,
          dueDate: dueDate,
          dueTime: dueTime,
        });

        setIsEditing(true);
        setShowTaskModal(true);
      }
    } else {
      // For non-task events, convert to task format
      const dueDate = moment(event.start).format("YYYY-MM-DD");
      const dueTime = moment(event.start).format("HH:mm");

      // Find category by color
      const category = eventCategories.find((cat) => cat.color === event.color);

      setCurrentTask({
        id: event.id,
        name: event.title,
        description: `Calendar event: ${category ? category.name : "Event"}`,
        status: "Ongoing",
        priority: "Medium",
        dueDate: dueDate,
        dueTime: dueTime,
        isCalendarEvent: true, // Flag to handle differently
      });

      setIsEditing(true);
      setShowTaskModal(true);
    }
  };

  // Handle task creation or update from TaskForm
  const handleTaskSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      // If it's a non-task calendar event
      if (currentTask.isCalendarEvent) {
        // Just update the local events array, don't call API
        const updatedEvents = events.map((event) => {
          if (event.id === currentTask.id) {
            const startDate = moment(
              `${currentTask.dueDate} ${currentTask.dueTime}`
            ).toDate();
            const endDate = moment(startDate).add(1, "hour").toDate();

            return {
              ...event,
              title: currentTask.name,
              start: startDate,
              end: endDate,
            };
          }
          return event;
        });

        setEvents(updatedEvents);
        calculateEventStats(updatedEvents);
        setShowTaskModal(false);
        return;
      }

      // Format the time properly
      const formattedTime = formatTimeWithAMPM(currentTask.dueTime || "12:00");

      // Prepare API payload
      const taskPayload = {
        title: currentTask.name,
        description: currentTask.description || "",
        dueDate: currentTask.dueDate,
        time: formattedTime,
        priority: currentTask.priority,
        status:
          currentTask.status === "Ongoing"
            ? "ONGOING"
            : currentTask.status === "Completed"
            ? "COMPLETED"
            : "PENDING",
      };

      if (isEditing && currentTask.id) {
        taskPayload.id = currentTask.id;
      }

      // Call the appropriate API endpoint
      const endpoint = isEditing ? "updateTask" : "addTask";
      await axios({
        method: isEditing ? "put" : "post",
        url: `http://localhost:8080/${endpoint}`,
        data: taskPayload,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setShowTaskModal(false);

      // Refresh tasks to update the calendar
      fetchTasks();
    } catch (error) {
      console.error("Error submitting task:", error);
    }
  };

  // Helper function to format time with AM/PM for API
  const formatTimeWithAMPM = (time) => {
    if (!time) return "12:00 PM";

    try {
      // Parse the 24-hour time
      const [hours, minutes] = time.split(":").map(Number);

      // Determine if it's AM or PM
      const period = hours >= 12 ? "PM" : "AM";

      // Convert to 12-hour format
      let hour12 = hours % 12;
      if (hour12 === 0) hour12 = 12;

      // Format with leading zeros
      return `${hour12.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "12:00 PM";
    }
  };

  // Handle event drag and drop
  const handleEventDrop = ({ event, start, end }) => {
    if (event.isTask) {
      // Task event - update the task due date in the API
      const task = tasks.find((t) => t.id === event.taskId);

      if (task) {
        // Create a copy of the current task with new date
        const updatedTask = {
          id: task.id,
          name: task.title,
          description: task.description || "",
          status:
            task.status === "ONGOING"
              ? "Ongoing"
              : task.status === "COMPLETED"
              ? "Completed"
              : "Incomplete",
          priority: task.priority,
          dueDate: moment(start).format("YYYY-MM-DD"),
          dueTime: moment(start).format("HH:mm"),
        };

        setCurrentTask(updatedTask);
        handleTaskSubmit(); // Call the same submit function

        // Also update the event in the events array for immediate UI update
        const updatedEvents = events.map((evt) => {
          if (evt.id === event.id) {
            return {
              ...evt,
              start: start,
              end: end,
            };
          }
          return evt;
        });

        setEvents(updatedEvents);
        calculateEventStats(updatedEvents);
      }
    } else {
      // Non-task event - just update local state
      const updatedEvents = events.map((evt) =>
        evt.id === event.id ? { ...evt, start, end } : evt
      );
      setEvents(updatedEvents);
      calculateEventStats(updatedEvents);
    }
  };

  // Handle event resize
  const handleEventResize = ({ event, start, end }) => {
    if (!event.isTask) {
      const updatedEvents = events.map((evt) =>
        evt.id === event.id ? { ...evt, start, end } : evt
      );
      setEvents(updatedEvents);
      calculateEventStats(updatedEvents);
    }
  };

  // Event style getter
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color || "#4DB6AC",
      color: "white",
      borderRadius: "8px",
      border: event.isTask ? "2px dashed #ffffff" : "none",
      padding: "5px",
      fontWeight: 500,
    },
  });

  // Handle view change
  const onView = (newView) => {
    setView(newView);
  };

  // Handle date navigation
  const onNavigate = (newDate) => {
    setDate(newDate);
  };

  return (
    <div
      className={`d-flex ${isDarkMode ? "dark-mode" : "light-mode"}`}
      style={{ minHeight: "100vh" }}
    >
      <Sidebar
        isDarkMode={isDarkMode}
        toggleDarkMode={() => {
          const newTheme = !isDarkMode;
          localStorage.setItem("theme", newTheme ? "dark" : "light");
          localStorage.setItem("darkMode", newTheme.toString());
          setIsDarkMode(newTheme);

          // Dispatch events without reloading the page
          document.dispatchEvent(new Event("themeChanged"));
          window.dispatchEvent(
            new CustomEvent("themeChanged", {
              detail: { isDarkMode: newTheme },
            })
          );
        }}
      />
      <div
        className="dashboard-container flex-grow-1 p-2 p-md-3"
        style={{
          backgroundColor: isDarkMode ? "#263238" : "#f9f9f9",
          color: isDarkMode ? "#e9ecef" : "#212529",
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        {/* Header section */}
        <header className="mb-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="d-flex align-items-center"
            >
              <h2
                className={`fw-bold mb-0 ${isDarkMode ? "text-light" : ""}`}
                style={{ color: isDarkMode ? "#e9ecef" : "#195283" }}
              >
                <i className="bi bi-calendar-week me-2"></i> Calendar
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

            {/* Optimize button spacing */}
            <div className="d-flex align-items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-sm"
                onClick={fetchTasks}
                style={{
                  backgroundColor: isDarkMode ? "transparent" : "transparent",
                  color: isDarkMode ? "#E0E0E0" : "#4A6FA5", // Updated to use light text in dark mode
                  border: `1px solid ${isDarkMode ? "#4A6FA5" : "#4A6FA5"}`,
                }}
              >
                <IoRefreshSharp className="me-1" /> Refresh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-sm"
                onClick={() =>
                  handleSelectSlot({
                    start: new Date(),
                    end: moment().add(1, "hour").toDate(),
                  })
                }
                style={{
                  backgroundColor: isDarkMode ? "#4A6FA5" : "#4A6FA5",
                  color: "#FFFFFF",
                  border: `1px solid ${isDarkMode ? "#4A6FA5" : "#4A6FA5"}`,
                }}
              >
                <i className="bi bi-plus-lg me-1"></i>
                Add Task
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-sm btn-icon"
                onClick={() => {
                  const newTheme = !isDarkMode;
                  // Update both storage keys to ensure compatibility
                  localStorage.setItem("theme", newTheme ? "dark" : "light");
                  localStorage.setItem("darkMode", newTheme.toString());
                  setIsDarkMode(newTheme);

                  // Dispatch both types of events for maximum compatibility
                  document.dispatchEvent(new Event("themeChanged"));
                  window.dispatchEvent(
                    new CustomEvent("themeChanged", {
                      detail: { isDarkMode: newTheme },
                    })
                  );
                }}
              >
                <i className={`bi ${isDarkMode ? "bi-sun" : "bi-moon"}`}></i>
              </motion.button>
            </div>
          </div>

          {/* Optimize date information spacing */}
          <div className="mt-1 d-flex flex-wrap justify-content-between align-items-center">
            <p
              className={`mb-0 small ${
                isDarkMode ? "text-light" : "text-muted"
              }`}
            >
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
                backgroundColor: isDarkMode ? "#4A6FA5" : "#4A6FA5",
                color: "#FFFFFF",
              }}
            >
              {stats.today} events today
            </span>
          </div>
        </header>

        {/* Main calendar */}
        <div
          className={`card shadow-sm mb-3 ${
            isDarkMode ? "bg-dark border-dark" : "bg-white"
          }`}
        >
          <div
            className={`card-header py-2 ${
              isDarkMode ? "bg-dark border-dark" : "bg-white"
            }`}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className={`mb-0 ${isDarkMode ? "text-light" : ""}`}>
                <i className="bi bi-calendar-range me-2"></i> Calendar
              </h5>
              <div className="d-flex">
                <Link
                  to="/homepage"
                  className="btn btn-sm me-1"
                  style={{
                    backgroundColor: "transparent",
                    color: isDarkMode ? "#E0E0E0" : "#4A6FA5",
                    border: `1px solid ${isDarkMode ? "#4A6FA5" : "#4A6FA5"}`,
                  }}
                >
                  <i className="bi bi-list-task me-1"></i> Tasks
                </Link>
                <Link
                  to="/dashboard"
                  className="btn btn-sm"
                  style={{
                    backgroundColor: "transparent",
                    color: isDarkMode ? "#E0E0E0" : "#4A6FA5",
                    border: `1px solid ${isDarkMode ? "#4A6FA5" : "#4A6FA5"}`,
                  }}
                >
                  <i className="bi bi-grid-1x2 me-1"></i> Dashboard
                </Link>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div
              className={`calendar-wrapper ${
                isDarkMode ? "calendar-dark" : ""
              }`}
            >
              <DnDCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "calc(100vh - 170px)" }} // Optimize height for viewport
                selectable
                resizable
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                defaultView={Views.MONTH}
                view={view}
                date={date}
                onView={onView}
                onNavigate={onNavigate}
                views={["month", "week", "day"]}
                step={15}
                timeslots={4}
                eventPropGetter={eventStyleGetter}
                popup
                components={{
                  toolbar: CustomToolbar,
                }}
                dayLayoutAlgorithm="no-overlap"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      <Modal
        show={showTaskModal}
        onHide={() => setShowTaskModal(false)}
        backdrop="static"
        centered
        size="lg"
      >
        <TaskForm
          taskData={currentTask}
          setTaskData={setCurrentTask}
          fetchTasks={handleTaskSubmit}
          isEditing={isEditing}
          closeForm={() => setShowTaskModal(false)}
          isDarkMode={isDarkMode}
        />
      </Modal>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
        }

        .dark-mode {
          color: #e9ecef;
        }

        .light-mode {
          color: #212529;
        }

        .calendar-wrapper {
          padding: 10px;
          border-radius: 8px;
        }

        /* Calendar header styling */
        :global(.rbc-header) {
          padding: 8px 3px;
          font-weight: 600;
        }

        /* Optimize day cell spacing */
        :global(.rbc-date-cell) {
          padding: 3px;
          font-weight: 500;
        }

        /* Reduce toolbar spacing */
        :global(.rbc-toolbar) {
          margin-bottom: 10px;
          padding: 6px 10px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          border-radius: 6px;
        }

        /* Optimize month view spacing */
        :global(.rbc-month-view) {
          border-radius: 6px;
        }

        /* Optimize event rendering */
        :global(.rbc-event) {
          padding: 2px 4px;
          font-size: 0.85rem;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Dark mode specific styles */
        .calendar-dark :global(.rbc-header) {
          background-color: #37474f; /* Darker shade like the dashboard */
          color: #e0e0e0; /* Cool Gray from your theme */
          border-bottom: 1px solid #455a64; /* Bluish gray border */
          padding: 8px 3px;
        }

        .calendar-dark :global(.rbc-toolbar) {
          background-color: #37474f; /* Same as header */
          color: #e0e0e0;
          padding: 6px 10px;
        }

        /* Update the buttons in dark mode */
        .calendar-dark :global(.btn-outline-primary) {
          border-color: #4a6fa5; /* Slate Blue from your theme */
          color: #e0e0e0;
        }

        .calendar-dark :global(.btn-outline-primary:hover) {
          background-color: #4a6fa5;
          color: #ffffff;
        }

        .calendar-dark :global(.btn-primary) {
          background-color: #4a6fa5;
          border-color: #4a6fa5;
        }

        /* Responsive styling */
        @media (max-width: 768px) {
          :global(.rbc-toolbar) {
            flex-direction: column;
            gap: 8px;
          }

          :global(.rbc-toolbar-label) {
            order: -1;
            margin-bottom: 8px;
          }

          :global(.rbc-btn-group) {
            display: flex;
            width: 100%;
          }

          :global(.rbc-btn-group button) {
            flex: 1;
            padding: 0.15rem 0.3rem;
            font-size: 0.85rem;
          }

          .calendar-wrapper {
            padding: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
