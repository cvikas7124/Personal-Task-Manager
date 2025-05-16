import React, { useState } from "react";
import { motion } from "framer-motion"; // Library for animations
import axios from "axios"; // Library for making HTTP requests
import Swal from "sweetalert2"; // Library for nice-looking alert dialogs

// This component is a form for adding or editing tasks
const TaskForm = ({
  taskData, // Current task data (empty for new tasks, filled for editing)
  setTaskData, // Function to update task data as user types
  fetchTasks, // Function to refresh the task list after changes
  isEditing, // Whether we're editing an existing task or creating a new one
  closeForm, // Function to close the form
  isDarkMode = false, // Whether dark mode is active
}) => {
  // Store error messages to show to the user
  const [errorMessage, setErrorMessage] = useState("");
  // Track when the form is being submitted to show loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if all required fields are filled correctly
  const validateForm = () => {
    if (!taskData.name || taskData.name.trim().length < 3) {
      setErrorMessage("Task name must be at least 3 characters long.");
      return false;
    }
    if (!taskData.description || taskData.description.trim().length < 5) {
      setErrorMessage("Description must be at least 5 characters long.");
      return false;
    }
    if (!taskData.dueDate) {
      setErrorMessage("Due date is required.");
      return false;
    }
    if (!taskData.dueTime) {
      setErrorMessage("Due time is required.");
      return false;
    }
    if (!taskData.priority) {
      setErrorMessage("Please select a priority level.");
      return false;
    }
    if (!taskData.status) {
      setErrorMessage("Please select a status.");
      return false;
    }

    return true; // All validation passes
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the form from refreshing the page
    setErrorMessage(""); // Clear any previous error messages

    if (!validateForm()) return; // Stop if validation fails
    setIsSubmitting(true); // Show loading state

    try {
      // Get the authentication token stored after login
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Authentication failed. Please login again.");
        setIsSubmitting(false);
        return;
      }

      // Convert time to 12-hour format with AM/PM as required by backend
      const formattedTime = formatTimeWithAMPM(taskData.dueTime);
      console.log("Formatted time:", formattedTime);

      // Prepare the data in the format the backend expects
      const apiData = {
        title: taskData.name ? taskData.name.trim() : "",
        description: taskData.description ? taskData.description.trim() : "",
        dueDate: taskData.dueDate,
        time: formattedTime,
        priority: taskData.priority
          ? taskData.priority.toUpperCase() // Backend expects uppercase
          : "MEDIUM",
        status: mapStatusToBackend(taskData.status), // Convert status format
      };

      // Add the task ID when editing an existing task
      if (isEditing && taskData.id) {
        apiData.id = taskData.id;
      }

      console.log("Sending task data:", apiData);

      // Send the request to create or update the task
      const taskResponse = await axios({
        method: isEditing ? "put" : "post", // PUT to update, POST to create
        url: `http://localhost:8080/${isEditing ? "updateTask" : "addTask"}`,
        data: apiData,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Send the auth token
        },
      });

      console.log("Task API response:", taskResponse.data);

      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Show success message
      Swal.fire({
        icon: "success",
        title: isEditing ? "Task Updated!" : "Task Added!",
        text: isEditing
          ? "Your task has been updated successfully."
          : "Your new task has been added successfully.",
        showConfirmButton: false,
        timer: 1500, // Auto-close after 1.5 seconds
        background: isDarkMode ? "#1E1E1E" : "#ffffff", // Dark/light background
        color: isDarkMode ? "#e0e0e0" : "#333", // Dark/light text
        didClose: () => {
          // After the success message closes
          fetchTasks(); // Refresh the task list

          // If we're adding a new task (not editing), clear the form data
          if (!isEditing) {
            setTaskData({
              name: "",
              description: "",
              dueDate: "",
              dueTime: "",
              priority: "",
              status: "",
            });
          }

          closeForm(); // Close the form
        },
      });
    } catch (apiError) {
      // Handle errors from the API
      console.error("Task API error:", apiError);
      setErrorMessage(
        apiError.response?.data?.message ||
          "There was a problem saving your task. Please try again."
      );
    } finally {
      setIsSubmitting(false); // Hide loading state
    }
  };

  // Convert our frontend status names to backend status codes
  const mapStatusToBackend = (status) => {
    if (!status) return "INCOMPLETE"; // Default value

    // Map of frontend status names to backend status codes
    const statusMap = {
      Incomplete: "INCOMPLETE",
      INCOMPLETE: "INCOMPLETE",
      Ongoing: "ONGOING",
      ONGOING: "ONGOING",
      Completed: "COMPLETED",
      COMPLETED: "COMPLETED",
    };

    const mappedStatus = statusMap[status] || "INCOMPLETE";
    console.log(`Mapping status: "${status}" → "${mappedStatus}"`);
    return mappedStatus;
  };

  // Handle task deletion
  const handleDelete = async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Authentication failed. Please login again.");
        return;
      }

      // Show confirmation dialog before deleting
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: isDarkMode ? "#4DB6AC" : "#195283",
        cancelButtonColor: isDarkMode ? "#ef5350" : "#dc3545",
        confirmButtonText: "Yes, delete it!",
        background: isDarkMode ? "#1E1E1E" : "#ffffff",
        color: isDarkMode ? "#e0e0e0" : "#333",
      });

      // Only proceed if user clicked "Yes"
      if (result.isConfirmed) {
        // Send delete request to the server
        await axios.delete(`http://localhost:8080/deleteTask/${taskData.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Show success message
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Your task has been deleted.",
          showConfirmButton: false,
          timer: 1500,
          background: isDarkMode ? "#1E1E1E" : "#ffffff",
          color: isDarkMode ? "#e0e0e0" : "#333",
        });

        fetchTasks(); // Refresh the task list
        closeForm(); // Close the form
      }
    } catch (err) {
      // Handle errors
      console.error("Delete error:", err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data ||
        "Failed to delete the task.";
      setErrorMessage(errorMsg);
    }
  };

  // Convert 24-hour time format to 12-hour format with AM/PM
  const formatTimeWithAMPM = (time) => {
    if (!time) return "12:00 PM"; // Default value

    try {
      // Parse the 24-hour time
      const [hours, minutes] = time.split(":").map(Number);

      // Determine if it's AM or PM
      const period = hours >= 12 ? "PM" : "AM";

      // Convert to 12-hour format
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

  // Render the form with appropriate styling based on theme
  return (
    <div
      className="p-4"
      style={{
        backgroundColor: isDarkMode ? "#263238" : "#FFFFFF", // Dark/light background
        borderRadius: "12px",
        color: isDarkMode ? "#E0E0E0" : "#333333", // Dark/light text
      }}
    >
      {/* Form header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5
          className="fw-bold m-0"
          style={{ color: isDarkMode ? "#4DB6AC" : "#4A6FA5" }} // Dark/light heading color
        >
          <i
            className={`bi ${
              isEditing ? "bi-pencil-square" : "bi-plus-circle"
            } me-2`}
          ></i>
          {isEditing ? "Edit Task" : "Add New Task"}
        </h5>
        {/* Close button with animation */}
        <motion.button
          type="button"
          className="btn-close"
          onClick={closeForm}
          whileHover={{ scale: 1.1 }} // Grow slightly on hover
          whileTap={{ scale: 0.9 }} // Shrink slightly when clicked
          style={{ filter: isDarkMode ? "invert(1)" : "none" }} // Invert color in dark mode
        />
      </div>

      {/* Error message area */}
      {errorMessage && (
        <div
          className="alert alert-danger py-2"
          style={{
            backgroundColor: isDarkMode ? "#FF6B6B33" : "#ffebee", // Transparent red in dark mode
            color: isDarkMode ? "#FF6B6B" : "#d32f2f", // Red text
            border: "none",
            borderRadius: "8px",
          }}
        >
          <i className="bi bi-exclamation-triangle me-2"></i>
          {errorMessage}
        </div>
      )}

      {/* Task form */}
      <form onSubmit={handleSubmit}>
        {/* Task name field */}
        <div className="mb-3">
          <label
            className="form-label"
            style={{ color: isDarkMode ? "#B0BEC5" : "#555" }}
          >
            Task Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter task name"
            value={taskData.name || ""}
            onChange={(e) => setTaskData({ ...taskData, name: e.target.value })}
            style={{
              backgroundColor: isDarkMode ? "#37474F" : "#F9FAFB", // Dark/light input background
              border: isDarkMode ? "1px solid #455A64" : "1px solid #E0E0E0", // Dark/light border
              color: isDarkMode ? "#E0E0E0" : "#333", // Dark/light text
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          />
        </div>

        {/* Task description field */}
        <div className="mb-3">
          <label
            className="form-label"
            style={{ color: isDarkMode ? "#B0BEC5" : "#555" }}
          >
            Description <span className="text-danger">*</span>
          </label>
          <textarea
            className="form-control"
            rows="3"
            placeholder="Enter task description"
            value={taskData.description || ""}
            onChange={(e) =>
              setTaskData({ ...taskData, description: e.target.value })
            }
            style={{
              backgroundColor: isDarkMode ? "#37474F" : "#F9FAFB",
              border: isDarkMode ? "1px solid #455A64" : "1px solid #E0E0E0",
              color: isDarkMode ? "#E0E0E0" : "#333",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          />
        </div>

        {/* Due date and time selection */}
        <div className="row mb-3">
          {/* Date picker */}
          <div className="col-md-6 mb-3 mb-md-0">
            <label
              className="form-label"
              style={{ color: isDarkMode ? "#B0BEC5" : "#555" }}
            >
              Due Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={taskData.dueDate || ""}
              min={new Date().toISOString().split("T")[0]} // Can't pick dates in the past
              onChange={(e) =>
                setTaskData({ ...taskData, dueDate: e.target.value })
              }
              style={{
                backgroundColor: isDarkMode ? "#37474F" : "#F9FAFB",
                border: isDarkMode ? "1px solid #455A64" : "1px solid #E0E0E0",
                color: isDarkMode ? "#E0E0E0" : "#333",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            />
          </div>
          {/* Time picker */}
          <div className="col-md-6">
            <label
              className="form-label"
              style={{ color: isDarkMode ? "#B0BEC5" : "#555" }}
            >
              Due Time <span className="text-danger">*</span>
            </label>
            <input
              type="time"
              className="form-control"
              value={taskData.dueTime || ""}
              onChange={(e) =>
                setTaskData({ ...taskData, dueTime: e.target.value })
              }
              style={{
                backgroundColor: isDarkMode ? "#37474F" : "#F9FAFB",
                border: isDarkMode ? "1px solid #455A64" : "1px solid #E0E0E0",
                color: isDarkMode ? "#E0E0E0" : "#333",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            />
          </div>
        </div>

        {/* Priority and Status selection */}
        <div className="row mb-3">
          {/* Priority dropdown */}
          <div className="col-md-6 mb-3 mb-md-0">
            <label
              className="form-label"
              style={{ color: isDarkMode ? "#B0BEC5" : "#555" }}
            >
              Priority <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={taskData.priority || ""}
              onChange={(e) =>
                setTaskData({ ...taskData, priority: e.target.value })
              }
              style={{
                backgroundColor: isDarkMode ? "#37474F" : "#F9FAFB",
                border: isDarkMode ? "1px solid #455A64" : "1px solid #E0E0E0",
                color: isDarkMode ? "#E0E0E0" : "#333",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              <option value="">SELECT PRIORITY</option>
              <option value="High">HIGH</option>
              <option value="Medium">MEDIUM</option>
              <option value="Low">LOW</option>
            </select>
          </div>
          {/* Status dropdown */}
          <div className="col-md-6">
            <label
              className="form-label"
              style={{ color: isDarkMode ? "#B0BEC5" : "#555" }}
            >
              Status <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={taskData.status || ""}
              onChange={(e) =>
                setTaskData({ ...taskData, status: e.target.value })
              }
              style={{
                backgroundColor: isDarkMode ? "#37474F" : "#F9FAFB",
                border: isDarkMode ? "1px solid #455A64" : "1px solid #E0E0E0",
                color: isDarkMode ? "#E0E0E0" : "#333",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              <option value="">SELECT STATUS</option>
              <option value="Incomplete">Incomplete</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Form buttons */}
        <div className="d-flex justify-content-between mt-4">
          <div>
            {/* Submit button (Add or Update) with loading state */}
            <motion.button
              type="submit"
              className="btn me-2"
              disabled={isSubmitting} // Disable while submitting
              whileHover={{ scale: 1.03 }} // Grow slightly on hover
              whileTap={{ scale: 0.97 }} // Shrink slightly when clicked
              style={{
                backgroundColor: isDarkMode ? "#4DB6AC" : "#4A6FA5", // Dark/light blue
                color: "#FFFFFF", // White text
                fontWeight: "500",
                padding: "10px 20px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)", // Slight shadow
                border: "none",
              }}
            >
              {isSubmitting ? (
                // Show spinner when submitting
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  {isEditing ? "Updating..." : "Adding..."}
                </>
              ) : (
                // Normal state
                <>
                  <i
                    className={`bi ${
                      isEditing ? "bi-check-lg" : "bi-plus-lg"
                    } me-2`}
                  ></i>
                  {isEditing ? "Update Task" : "Add Task"}
                </>
              )}
            </motion.button>
            {/* Cancel button */}
            <motion.button
              type="button"
              className="btn"
              onClick={closeForm}
              disabled={isSubmitting} // Disable while submitting
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                backgroundColor: "transparent",
                color: isDarkMode ? "#B0BEC5" : "#607D8B", // Gray text
                borderColor: isDarkMode ? "#455A64" : "#B0BEC5", // Gray border
                padding: "10px 20px",
                borderRadius: "8px",
              }}
            >
              Cancel
            </motion.button>
          </div>

          {/* Delete button (only shown when editing an existing task) */}
          {isEditing && (
            <motion.button
              type="button"
              className="btn"
              onClick={handleDelete}
              disabled={isSubmitting} // Disable while submitting
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                backgroundColor: "transparent",
                color: isDarkMode ? "#FF6B6B" : "#FF6B6B", // Red text
                borderColor: isDarkMode ? "#FF6B6B" : "#FF6B6B", // Red border
                padding: "10px 20px",
                borderRadius: "8px",
              }}
            >
              <i className="bi bi-trash me-2"></i>
              Delete Task
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
