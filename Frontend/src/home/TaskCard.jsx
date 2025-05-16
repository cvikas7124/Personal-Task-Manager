import React from "react";
import { motion } from "framer-motion"; // Library for animations

// This component displays an individual task as a card
const TaskCard = ({
  task, // The task data to display
  index, // The position of this task in the list
  handleEditTask, // Function to edit this task
  handleDelete, // Function to delete this task
  handleQuickStatusUpdate, // Function to quickly change task status
  isDarkMode = false, // Whether dark mode is active
}) => {
  // Define colors and styles for both light and dark modes
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
      primary: "#4A6FA5", // Slate Blue
      secondary: "#607D8B", // Bluish gray
      success: "#4DB6AC", // Light Teal
      danger: "#FF6B6B", // Bright Coral
      warning: "#FFD54F", // Muted Gold
      info: "#2979FF", // Electric Blue
      accent: "#7E57C2", // Accent Purple
      headerBg: "#1E272C", // Darker than background for headers
    },
  };

  // Select the right color scheme based on current mode
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  // Calculate days remaining until task is due
  const due = new Date(task.dueDate);
  const now = new Date();
  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  // Format time from the task's due date
  const formatTime = (dateString) => {
    // If time is already provided separately, use that
    if (task.time) {
      return task.time;
    }

    // Otherwise, extract time from the due date
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  // Get the appropriate styling for task status (regardless of case)
  const getStatusStyles = (status) => {
    // Convert status to lowercase for case-insensitive comparison
    const normalizedStatus = status?.toLowerCase();

    // Choose colors and icon based on status
    if (normalizedStatus?.includes("complete")) {
      // Green for completed tasks
      return {
        bg: isDarkMode ? "rgba(77, 182, 172, 0.2)" : "#d1e7dd",
        text: isDarkMode ? "#4DB6AC" : "#0f5132",
        icon: "check-circle-fill",
      };
    } else if (normalizedStatus?.includes("ongoing")) {
      // Blue for ongoing tasks
      return {
        bg: isDarkMode ? "rgba(41, 121, 255, 0.2)" : "#cfe2ff",
        text: isDarkMode ? "#2979FF" : "#084298",
        icon: "play-fill",
      };
    } else {
      // Yellow for incomplete tasks
      return {
        bg: isDarkMode ? "rgba(255, 213, 79, 0.2)" : "#fff3cd",
        text: isDarkMode ? "#FFD54F" : "#0f5132",
        icon: "hourglass-split",
      };
    }
  };

  // Get the appropriate styling for task priority (regardless of case)
  const getPriorityStyles = (priority) => {
    // Convert priority to lowercase for case-insensitive comparison
    const normalizedPriority = priority?.toLowerCase();

    // Choose colors and icon based on priority level
    if (normalizedPriority?.includes("high")) {
      // Red for high priority
      return {
        bg: isDarkMode ? "rgba(255, 107, 107, 0.2)" : "#f8d7da",
        text: isDarkMode ? "#FF6B6B" : "#842029",
        icon: "exclamation-triangle-fill",
      };
    } else if (normalizedPriority?.includes("medium")) {
      // Yellow for medium priority
      return {
        bg: isDarkMode ? "rgba(255, 213, 79, 0.2)" : "#fff3cd",
        text: isDarkMode ? "#FFD54F" : "#664d03",
        icon: "dash-circle-fill",
      };
    } else {
      // Green for low priority
      return {
        bg: isDarkMode ? "rgba(77, 182, 172, 0.2)" : "#d1e7dd",
        text: isDarkMode ? "#4DB6AC" : "#0f5132",
        icon: "arrow-down-circle-fill",
      };
    }
  };

  // Get styling and text for the due date badge
  const getDueDateBadge = () => {
    // For completed tasks, show "Completed" badge
    if (task.status === "Completed") {
      return {
        bg: isDarkMode ? "rgba(77, 182, 172, 0.2)" : "#d1e7dd", // Green
        text: isDarkMode ? "#4DB6AC" : "#0f5132", // Green text
        message: "Completed",
      };
    }

    // For non-completed tasks, show time remaining
    if (daysLeft < 0) {
      // Red for overdue tasks
      return {
        bg: isDarkMode ? "rgba(255, 107, 107, 0.2)" : "#f8d7da",
        text: isDarkMode ? "#FF6B6B" : "#842029",
        message: "Overdue",
      };
    } else if (daysLeft === 0) {
      // Yellow for tasks due today
      return {
        bg: isDarkMode ? "rgba(255, 213, 79, 0.2)" : "#fff3cd",
        text: isDarkMode ? "#FFD54F" : "#664d03",
        message: "Due today",
      };
    } else if (daysLeft === 1) {
      // Yellow for tasks due tomorrow
      return {
        bg: isDarkMode ? "rgba(255, 213, 79, 0.2)" : "#fff3cd",
        text: isDarkMode ? "#FFD54F" : "#664d03",
        message: "Due tomorrow",
      };
    } else if (daysLeft <= 3) {
      // Blue for tasks coming up soon
      return {
        bg: isDarkMode ? "rgba(41, 121, 255, 0.2)" : "#cfe2ff",
        text: isDarkMode ? "#2979FF" : "#084298",
        message: `${daysLeft} days left`,
      };
    } else {
      // Green for tasks with plenty of time left
      return {
        bg: isDarkMode ? "rgba(77, 182, 172, 0.2)" : "#d1e7dd",
        text: isDarkMode ? "#4DB6AC" : "#0f5132",
        message: `${daysLeft} days left`,
      };
    }
  };

  // Get the styles for status, priority, and due date
  const statusStyles = getStatusStyles(task.status);
  const priorityStyles = getPriorityStyles(task.priority);
  const dueDateBadge = getDueDateBadge();

  // Function to toggle the task status when clicked
  const toggleStatus = () => {
    // Get current status in lowercase for consistent comparison
    const normalizedStatus = String(task.status).toLowerCase();
    let newStatus;

    // Determine the next status in the cycle
    if (normalizedStatus.includes("complet")) {
      // If completed, change to Ongoing rather than Incomplete
      newStatus = "Ongoing";
    } else if (normalizedStatus.includes("ongo")) {
      // If ongoing, mark as Completed
      newStatus = "Completed";
    } else {
      // If incomplete, move to Ongoing
      newStatus = "Ongoing";
    }

    console.log(`Changing task status from ${task.status} to ${newStatus}`);

    // Call the handler with the task object and new status
    handleQuickStatusUpdate(task, newStatus);
  };

  // Render the task card with appropriate styling
  return (
    <motion.div
      className="card h-100 border-0 shadow-sm"
      style={{
        borderRadius: "12px", // Rounded corners
        overflow: "hidden", // Hide overflow
        // Different background for completed tasks
        backgroundColor:
          task.status?.toLowerCase() === "completed" // More strict comparison
            ? isDarkMode
              ? "rgba(77, 182, 172, 0.05)" // Dark mode completed task bg
              : "rgba(208, 244, 242, 0.05)" // Light mode completed task bg
            : isDarkMode
            ? currentTheme.cardBg // Dark mode normal card bg
            : currentTheme.cardBg, // Light mode normal card bg
        border: isDarkMode ? `1px solid ${currentTheme.border}` : "none",
      }}
      whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0,0,0,0.12)" }} // Lift card on hover
      transition={{ duration: 0.2 }}
    >
      {/* Card header with priority and status badges */}
      <div
        className="card-header border-0 d-flex justify-content-between align-items-center"
        style={{
          backgroundColor:
            task.status?.toLowerCase() === "completed" // More strict comparison
              ? isDarkMode
                ? "rgba(77, 182, 172, 0.1)" // Dark mode completed task header
                : "rgba(208, 244, 242, 0.1)" // Light mode completed task header
              : isDarkMode
              ? currentTheme.headerBg // Dark mode normal header
              : "#f8f9fa", // Light mode normal header
          padding: "14px 16px",
          borderBottom: `1px solid ${
            isDarkMode ? currentTheme.border : "rgba(0,0,0,0.05)"
          }`,
        }}
      >
        <div className="d-flex align-items-center">
          {/* Priority badge */}
          <span
            className="badge rounded-pill me-2"
            style={{
              backgroundColor: priorityStyles.bg,
              color: priorityStyles.text,
              padding: "6px 12px",
              fontSize: "0.8rem",
            }}
          >
            <i className={`bi bi-${priorityStyles.icon} me-1`}></i>
            {task.priority}
          </span>
          {/* Status badge - clickable to change status */}
          <motion.span
            className="badge rounded-pill"
            style={{
              backgroundColor: statusStyles.bg,
              color: statusStyles.text,
              padding: "6px 12px",
              fontSize: "0.8rem",
              cursor: "pointer", // Show pointer cursor for clickable element
            }}
            whileHover={{ scale: 1.05 }} // Grow slightly on hover
            whileTap={{ scale: 0.95 }} // Shrink slightly when clicked
            onClick={toggleStatus}
            title="Click to change status" // Tooltip to explain the action
          >
            <i className={`bi bi-${statusStyles.icon} me-1`}></i>
            {task.status}
          </motion.span>
        </div>
      </div>

      {/* Card body with task details */}
      <div
        className="card-body"
        style={{
          padding: "16px",
          backgroundColor: isDarkMode ? currentTheme.cardBg : "#ffffff",
        }}
      >
        {/* Task title */}
        <h5
          className="card-title mb-2 d-flex align-items-center"
          style={{
            fontWeight: "600",
            // Strike through and gray out completed tasks
            color:
              task.status?.toLowerCase() === "completed" // More strict comparison
                ? isDarkMode
                  ? "#B0BEC5"
                  : "#607D8B"
                : isDarkMode
                ? currentTheme.text
                : undefined,
          }}
        >
          <span
            className={
              task.status?.toLowerCase() === "completed" // More strict comparison
                ? "text-decoration-line-through" // Strike through completed tasks
                : ""
            }
          >
            {task.title}
          </span>
        </h5>

        {/* Task description */}
        <p
          className="card-text mb-3"
          style={{
            fontSize: "0.9rem",
            overflow: "hidden",
            textOverflow: "ellipsis", // Add ... at the end of truncated text
            display: "-webkit-box",
            WebkitLineClamp: 2, // Limit to 2 lines
            WebkitBoxOrient: "vertical",
            // Gray out completed tasks
            color:
              task.status?.toLowerCase() === "completed" // More strict comparison
                ? isDarkMode
                  ? "#78909C"
                  : "#90A4AE"
                : isDarkMode
                ? currentTheme.mutedText
                : "#607D8B",
          }}
        >
          {task.description}
        </p>

        {/* Due date with badge */}
        <div className="d-flex align-items-center mb-3">
          <i
            className={`bi ${
              task.status?.toLowerCase() === "completed" // More strict comparison
                ? "bi-check-circle text-success" // Checkmark for completed tasks
                : "bi-calendar3 text-secondary" // Calendar for other tasks
            } me-2`}
            style={{
              color:
                isDarkMode && task.status?.toLowerCase() === "completed" // More strict comparison
                  ? "#4DB6AC"
                  : isDarkMode
                  ? currentTheme.mutedText
                  : undefined,
            }}
          ></i>
          <span
            style={{
              fontSize: "0.9rem",
              color:
                task.status?.toLowerCase() === "completed" // More strict comparison
                  ? isDarkMode
                    ? "#4DB6AC"
                    : "#4DB6AC"
                  : isDarkMode
                  ? currentTheme.mutedText
                  : "#6c757d",
            }}
          >
            {/* Show "Completed on" for completed tasks, otherwise show "Due on" */}
            {task.status?.toLowerCase() === "completed" // More strict comparison
              ? `Completed on ${new Date(task.dueDate).toLocaleDateString()}`
              : `${new Date(task.dueDate).toLocaleDateString()} at ${
                  task.time || formatTime(task.dueDate)
                }`}
          </span>
          {/* Only show due date badge for non-completed tasks */}
          {task.status?.toLowerCase() !== "completed" && ( // More strict comparison
            <span
              className="ms-2 badge"
              style={{
                backgroundColor: dueDateBadge.bg,
                color: dueDateBadge.text,
                fontSize: "0.75rem",
                padding: "0.25em 0.6em",
              }}
            >
              {dueDateBadge.message}
            </span>
          )}
        </div>
      </div>

      {/* Card footer with action buttons */}
      <div
        className="card-footer border-0 d-flex justify-content-between"
        style={{
          padding: "14px 16px",
          backgroundColor:
            task.status?.toLowerCase() === "completed" // More strict comparison
              ? isDarkMode
                ? "rgba(77, 182, 172, 0.1)" // Dark mode completed task footer
                : "rgba(208, 244, 242, 0.1)" // Light mode completed task footer
              : isDarkMode
              ? currentTheme.headerBg // Dark mode normal footer
              : "#f8f9fa", // Light mode normal footer
          borderTop: `1px solid ${
            isDarkMode ? currentTheme.border : "rgba(0,0,0,0.05)"
          }`,
        }}
      >
        {/* Status toggle button - changes text based on current status */}
        <motion.button
          className="btn btn-sm mr-1"
          onClick={toggleStatus}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            flex: 1,
            backgroundColor:
              task.status === "Completed"
                ? isDarkMode
                  ? "#607D8B"
                  : "#B0BEC5" // Gray for reopening completed tasks
                : task.status === "Ongoing"
                ? isDarkMode
                  ? "#3A9E93"
                  : "#4DB6AC" // Green for completing ongoing tasks
                : isDarkMode
                ? "#2662D9"
                : "#2979FF", // Blue for starting incomplete tasks
            color: "#FFFFFF", // White text
            border: "none",
            borderRadius: "6px",
            padding: "0.4rem 0.6rem",
            fontSize: "0.85rem",
            marginRight: "4px",
          }}
        >
          <i className={`bi bi-${statusStyles.icon} me-1`}></i>
          {task.status === "Completed"
            ? "Reopen" // Text for completed tasks
            : task.status === "Ongoing"
            ? "Complete" // Text for ongoing tasks
            : "Start"}{" "}
          {/* Text for incomplete tasks */}
        </motion.button>

        {/* Edit button */}
        <motion.button
          className="btn btn-sm mx-1"
          onClick={() => handleEditTask(index)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            flex: 1,
            backgroundColor: "transparent",
            color: isDarkMode ? currentTheme.primary : "#4A6FA5", // Slate Blue
            borderColor: isDarkMode ? currentTheme.primary : "#4A6FA5",
            borderRadius: "6px",
            padding: "0.4rem 0.6rem",
            fontSize: "0.85rem",
          }}
        >
          <i className="bi bi-pencil me-1"></i>
          Edit
        </motion.button>

        {/* Delete button */}
        <motion.button
          className="btn btn-sm ml-1"
          onClick={() => handleDelete(index)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            flex: 1,
            backgroundColor: "transparent",
            color: isDarkMode ? currentTheme.danger : "#FF6B6B", // Bright Coral
            borderColor: isDarkMode ? currentTheme.danger : "#FF6B6B",
            borderRadius: "6px",
            padding: "0.4rem 0.6rem",
            fontSize: "0.85rem",
            marginLeft: "4px",
          }}
        >
          <i className="bi bi-trash me-1"></i>
          Delete
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TaskCard;
