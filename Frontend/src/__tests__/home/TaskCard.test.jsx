import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import axios from "axios";
import TaskForm from "../../home/TaskForm";
import Swal from "sweetalert2";
import "@testing-library/jest-dom";

// Mock axios
jest.mock("axios");

// Mock Sweetalert2 to execute didClose immediately
jest.mock("sweetalert2", () => ({
  fire: jest.fn().mockImplementation((params) => {
    // If there's a didClose callback in the params, call it immediately
    if (params && typeof params.didClose === "function") {
      params.didClose();
    }
    return Promise.resolve({ isConfirmed: true });
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {
    token: "fake-token-123", // Pre-populate with test token
  };
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock the current date for testing
const mockDate = new Date("2025-05-13");
const originalDate = Date;
global.Date = class extends Date {
  constructor(date) {
    if (date) {
      return new originalDate(date);
    }
    return mockDate;
  }
  static now() {
    return mockDate.getTime();
  }
};

describe("TaskForm Component", () => {
  // Sample task data for testing
  const mockTask = {
    id: 1,
    name: "Test Task",
    description: "This is a test task",
    dueDate: "2025-06-01",
    dueTime: "14:00",
    priority: "Medium",
    status: "Incomplete",
  };

  // Common props used across tests
  const defaultProps = {
    taskData: {},
    setTaskData: jest.fn(),
    fetchTasks: jest.fn(),
    isEditing: false,
    closeForm: jest.fn(),
    isDarkMode: false,
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset the axios mock implementation
    axios.mockReset();
  });

  afterAll(() => {
    // Restore original Date
    global.Date = originalDate;
  });

  test("renders task form in add mode correctly", () => {
    render(<TaskForm {...defaultProps} />);

    // Check for form title
    expect(screen.getByText("Add New Task")).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByLabelText(/Task Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();

    // Check for buttons
    expect(
      screen.getByRole("button", { name: /Add Task/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();

    // Delete button should not be visible in add mode
    expect(
      screen.queryByRole("button", { name: /Delete Task/i })
    ).not.toBeInTheDocument();
  });

  test("renders task form in edit mode correctly", () => {
    render(<TaskForm {...defaultProps} isEditing={true} taskData={mockTask} />);

    // Check for form title
    expect(screen.getByText("Edit Task")).toBeInTheDocument();

    // Check that form fields are pre-populated
    expect(screen.getByDisplayValue("Test Task")).toBeInTheDocument();
    expect(screen.getByDisplayValue("This is a test task")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2025-06-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("14:00")).toBeInTheDocument();

    // Check that the buttons are correct for edit mode
    expect(
      screen.getByRole("button", { name: /Update Task/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Delete Task/i })
    ).toBeInTheDocument();
  });

  test("handles form input changes", () => {
    render(<TaskForm {...defaultProps} />);

    // Get form fields
    const nameInput = screen.getByPlaceholderText("Enter task name");
    const descriptionInput = screen.getByPlaceholderText(
      "Enter task description"
    );
    const dateInput = screen.getByLabelText(/Due Date/i);
    const timeInput = screen.getByLabelText(/Due Time/i);

    // Change values
    fireEvent.change(nameInput, { target: { value: "New Task" } });
    fireEvent.change(descriptionInput, {
      target: { value: "New Description" },
    });
    fireEvent.change(dateInput, { target: { value: "2025-06-01" } });
    fireEvent.change(timeInput, { target: { value: "15:00" } });

    // Check if setTaskData was called with updated values
    expect(defaultProps.setTaskData).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New Task",
      })
    );
    expect(defaultProps.setTaskData).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "New Description",
      })
    );
    expect(defaultProps.setTaskData).toHaveBeenCalledWith(
      expect.objectContaining({
        dueDate: "2025-06-01",
      })
    );
    expect(defaultProps.setTaskData).toHaveBeenCalledWith(
      expect.objectContaining({
        dueTime: "15:00",
      })
    );
  });

  test("handles priority and status selection", () => {
    render(<TaskForm {...defaultProps} />);

    // Get dropdown selects
    const prioritySelect = screen.getByLabelText(/Priority/i);
    const statusSelect = screen.getByLabelText(/Status/i);

    // Change values
    fireEvent.change(prioritySelect, { target: { value: "High" } });
    fireEvent.change(statusSelect, { target: { value: "Ongoing" } });

    // Check if setTaskData was called with updated values
    expect(defaultProps.setTaskData).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: "High",
      })
    );
    expect(defaultProps.setTaskData).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "Ongoing",
      })
    );
  });

  test("validates form before submission", async () => {
    render(<TaskForm {...defaultProps} />);

    // Submit form without filling required fields
    fireEvent.click(screen.getByRole("button", { name: /Add Task/i }));

    // Should show validation error
    await waitFor(() => {
      expect(
        screen.getByText("Task name must be at least 3 characters long.")
      ).toBeInTheDocument();
    });

    // API should not be called
    expect(axios).not.toHaveBeenCalled();
  });

  test("submits new task successfully", async () => {
    // Mock a successful API response
    axios.mockResolvedValueOnce({
      data: { message: "Task created successfully" },
    });

    // Render form with complete task data
    const completedTaskData = {
      name: "Complete Task",
      description: "This is a complete task description",
      dueDate: "2025-06-01",
      dueTime: "14:00",
      priority: "High",
      status: "Incomplete",
    };

    render(<TaskForm {...defaultProps} taskData={completedTaskData} />);

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Add Task/i }));
    });

    // Wait for the axios call to be made
    await waitFor(() => {
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "post",
          url: "http://localhost:8080/addTask",
          data: expect.objectContaining({
            title: "Complete Task",
            description: "This is a complete task description",
            priority: "HIGH", // Should be uppercase in API request
          }),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer fake-token-123",
          }),
        })
      );
    });

    // Check that Swal was called with success parameters
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Task Added!",
      })
    );

    // Because our mock triggers didClose immediately, these should have been called
    expect(defaultProps.fetchTasks).toHaveBeenCalled();
    expect(defaultProps.closeForm).toHaveBeenCalled();
  });

  test("updates existing task successfully", async () => {
    // Mock a successful API response
    axios.mockResolvedValueOnce({
      data: { message: "Task updated successfully" },
    });

    // Render form in edit mode with task data and setTaskData that actually updates the data
    const updatedTask = { ...mockTask };
    const setTaskData = jest.fn((updates) => {
      Object.assign(updatedTask, updates);
    });

    render(
      <TaskForm
        {...defaultProps}
        isEditing={true}
        taskData={updatedTask}
        setTaskData={setTaskData}
      />
    );

    // Make a change to the task description
    const descriptionInput = screen.getByDisplayValue("This is a test task");
    fireEvent.change(descriptionInput, {
      target: { value: "Updated description" },
    });

    // Make sure the task data was updated
    expect(updatedTask.description).toBe("Updated description");

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Update Task/i }));
    });

    // Wait for the axios call to be made
    await waitFor(() => {
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "put",
          url: "http://localhost:8080/updateTask",
          data: expect.objectContaining({
            id: 1,
            title: "Test Task",
            description: "Updated description",
          }),
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token-123",
          }),
        })
      );
    });

    // Check that Swal was called with success parameters
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Task Updated!",
      })
    );

    // Our didClose mock ensures these are called
    expect(defaultProps.fetchTasks).toHaveBeenCalled();
    expect(defaultProps.closeForm).toHaveBeenCalled();
  });

  test("handles task deletion", async () => {
    // Mock axios delete success
    axios.delete.mockResolvedValueOnce({
      data: { message: "Task deleted successfully" },
    });

    // Render form in edit mode with task data
    render(<TaskForm {...defaultProps} isEditing={true} taskData={mockTask} />);

    // Click delete button
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Delete Task/i }));
    });

    // Should show confirmation dialog
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Are you sure?",
        icon: "warning",
        showCancelButton: true,
      })
    );

    // Wait for deletion API call
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:8080/deleteTask/1",
        expect.objectContaining({
          headers: {
            Authorization: "Bearer fake-token-123",
          },
        })
      );
    });

    // Check for second Swal call (success message)
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Deleted!",
      })
    );

    // Check that tasks were refreshed and form closed
    expect(defaultProps.fetchTasks).toHaveBeenCalled();
    expect(defaultProps.closeForm).toHaveBeenCalled();
  });

  test("handles form submission error", async () => {
    // Mock axios error
    const errorMessage = "Server error";
    axios.mockRejectedValueOnce({
      response: {
        data: { message: errorMessage },
      },
    });

    // Render form with complete task data
    const completedTaskData = {
      name: "Complete Task",
      description: "This is a complete task description",
      dueDate: "2025-06-01",
      dueTime: "14:00",
      priority: "High",
      status: "Incomplete",
    };

    render(<TaskForm {...defaultProps} taskData={completedTaskData} />);

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Add Task/i }));
    });

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });

    // Form should not be closed
    expect(defaultProps.closeForm).not.toHaveBeenCalled();
  });

  test("handles cancel button click", () => {
    render(<TaskForm {...defaultProps} />);

    // Click cancel button
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    // Form should be closed
    expect(defaultProps.closeForm).toHaveBeenCalled();
  });

  test("formats time correctly", async () => {
    // Mock axios success
    axios.mockResolvedValueOnce({
      data: { message: "Task created successfully" },
    });

    // Render form with complete task data including 24-hour time
    const taskData = {
      name: "Time Test Task",
      description: "Testing time format",
      dueDate: "2025-06-01",
      dueTime: "14:30", // 24-hour format
      priority: "Medium",
      status: "Incomplete",
    };

    render(<TaskForm {...defaultProps} taskData={taskData} />);

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Add Task/i }));
    });

    // Wait for the form submission to complete
    await waitFor(() => {
      // Check if axios was called with correctly formatted time (12-hour with AM/PM)
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            time: "02:30 PM", // Properly formatted 12-hour time with leading zero
          }),
        })
      );
    });
  });
});
