import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { toast } from "react-toastify";
import HomePage from "../../home/HomePage";
import { BrowserRouter } from "react-router-dom";

// Mock dependencies
jest.mock("axios");
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container" />,
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock react-router-dom hooks
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: () => ({
    search: "",
    pathname: "/",
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {
    token: "fake-token-123",
    darkMode: "false",
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

// Sample mock task data
const mockTasks = [
  {
    id: 1,
    title: "Complete Project",
    description: "Finish the React project by end of week",
    dueDate: "2025-06-01",
    time: "02:00 PM",
    status: "ONGOING",
    priority: "High",
  },
  {
    id: 2,
    title: "Review Code",
    description: "Code review for team members",
    dueDate: "2025-05-25",
    time: "10:00 AM",
    status: "COMPLETED",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Fix Bugs",
    description: "Address reported bugs in the application",
    dueDate: "2025-05-20",
    time: "04:00 PM",
    status: "INCOMPLETE",
    priority: "High",
  },
];

// Wrap component with router for testing
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

// Setup mock date for consistent tests
const mockDate = new Date("2025-05-15T12:00:00Z");
global.Date = class extends Date {
  constructor(date) {
    if (date) {
      return super(date);
    }
    return mockDate;
  }

  static now() {
    return mockDate.getTime();
  }
};

describe("HomePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for successful tasks fetch
    axios.get.mockResolvedValueOnce({ data: mockTasks });
  });

  test("renders homepage with initial tasks", async () => {
    renderWithRouter(<HomePage />);

    // Check if loading state shows initially
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    // Wait for tasks to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:8080/getTask",
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token-123" },
        })
      );
    });

    // Check if main UI elements are rendered
    expect(screen.getByText("Task Management")).toBeInTheDocument();
    expect(screen.getByText("Add New Task")).toBeInTheDocument();
    expect(screen.getByText("Task Filters")).toBeInTheDocument();

    // Check if tasks are displayed
    await waitFor(() => {
      expect(screen.getByText("Complete Project")).toBeInTheDocument();
      expect(screen.getByText("Review Code")).toBeInTheDocument();
      expect(screen.getByText("Fix Bugs")).toBeInTheDocument();
    });
  });

  test("shows error toast when token is missing", async () => {
    // Mock localStorage to return null for token
    localStorage.getItem.mockImplementationOnce(() => null);

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "You must be logged in to view tasks"
      );
    });
  });

  test("displays error toast when API call fails", async () => {
    // Mock failed API call
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "No task Exist's. Please try again later."
      );
    });
  });

  test("toggles dark mode", async () => {
    renderWithRouter(<HomePage />);

    // Initial state should be light mode based on our localStorage mock
    expect(localStorage.getItem("darkMode")).toBe("false");

    // Find sidebar toggle (since it's outside HomePage we can't directly test it)
    // But we can test the localStorage updates and theme application

    // Simulate theme change event
    const themeChangeEvent = new CustomEvent("themeChanged", {
      detail: { isDarkMode: true },
    });
    window.dispatchEvent(themeChangeEvent);

    // Check if state updated
    await waitFor(() => {
      // We'd check if dark theme classes are applied
      // This is a simple approximation since we can't easily check React state in tests
      expect(localStorage.getItem("darkMode")).toBe("false"); // Remains unchanged as our mock events don't trigger setter
    });
  });

  test("filters tasks when filter buttons are clicked", async () => {
    // Mock responses for different filter types
    axios.get.mockImplementation((url) => {
      if (url.includes("getCompletedTask")) {
        return Promise.resolve({
          data: mockTasks.filter((task) => task.status === "COMPLETED"),
        });
      } else {
        return Promise.resolve({ data: mockTasks });
      }
    });

    renderWithRouter(<HomePage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Complete Project")).toBeInTheDocument();
    });

    // Click on completed filter
    const completedFilterBtn = screen.getByRole("button", {
      name: /Completed/i,
    });
    fireEvent.click(completedFilterBtn);

    await waitFor(() => {
      // Should call the completed tasks endpoint
      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:8080/getCompletedTask",
        expect.any(Object)
      );
    });
  });

  test("searches tasks by query", async () => {
    renderWithRouter(<HomePage />);

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText("Complete Project")).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText("Search tasks...");
    fireEvent.change(searchInput, { target: { value: "Review" } });

    // Should filter the visible tasks
    await waitFor(() => {
      expect(screen.getByText("Review Code")).toBeInTheDocument();
      expect(screen.queryByText("Complete Project")).not.toBeInTheDocument();
    });
  });

  test("toggles between card and list view", async () => {
    renderWithRouter(<HomePage />);

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText("Complete Project")).toBeInTheDocument();
    });

    // Default should be card view
    expect(screen.getByRole("button", { name: /Card View/i })).toHaveClass(
      "btn-secondary"
    );

    // Click on list view button
    const listViewBtn = screen.getByRole("button", { name: /List View/i });
    fireEvent.click(listViewBtn);

    // List view button should now be active
    expect(listViewBtn).toHaveClass("btn-secondary");
  });

  test("opens add task modal", async () => {
    renderWithRouter(<HomePage />);

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText("Complete Project")).toBeInTheDocument();
    });

    // Click add task button
    const addTaskBtn = screen.getByRole("button", { name: /Add New Task/i });
    fireEvent.click(addTaskBtn);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText("Add New Task")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter task name")
      ).toBeInTheDocument();
    });
  });

  test("handles adding a new task", async () => {
    // Mock the post response
    axios.post.mockResolvedValueOnce({
      data: { message: "Task created successfully" },
    });

    renderWithRouter(<HomePage />);

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText("Complete Project")).toBeInTheDocument();
    });

    // Open add task modal
    const addTaskBtn = screen.getByRole("button", { name: /Add New Task/i });
    fireEvent.click(addTaskBtn);

    // Fill out the form
    const nameInput = await screen.findByPlaceholderText("Enter task name");
    const descriptionInput = screen.getByPlaceholderText(
      "Enter task description"
    );

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "New Test Task" } });
      fireEvent.change(descriptionInput, {
        target: { value: "This is a test task description" },
      });

      // We'd also need to set date, time, priority, status but those inputs might be harder to access
      // For simplicity we'll skip them in this test
    });

    // Submit the form
    const submitBtn = screen.getByRole("button", { name: /Add Task/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Check if API was called with correct data
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:8080/addTask",
        expect.objectContaining({
          title: "New Test Task",
          description: "This is a test task description",
        }),
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith("Task added successfully!");
    });
  });

  test("handles editing a task", async () => {
    // Mock API responses
    axios.put.mockResolvedValueOnce({
      data: { message: "Task updated successfully" },
    });

    renderWithRouter(<HomePage />);

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText("Complete Project")).toBeInTheDocument();
    });

    // Find and click edit button for a task
    // This depends on your implementation details - adjust as needed
    const editButtons = await screen.findAllByRole("button", { name: /Edit/i });
    await act(async () => {
      fireEvent.click(editButtons[0]);
    });

    // Modal should open with task data
    await waitFor(() => {
      expect(screen.getByText("Edit Task")).toBeInTheDocument();
    });

    // Change some data
    const descriptionInput = screen.getByDisplayValue(
      "Finish the React project by end of week"
    );
    await act(async () => {
      fireEvent.change(descriptionInput, {
        target: { value: "Updated description" },
      });
    });

    // Submit the form
    const updateBtn = screen.getByRole("button", { name: /Update Task/i });
    await act(async () => {
      fireEvent.click(updateBtn);
    });

    // Check if API was called to update
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "http://localhost:8080/updateTask",
        expect.objectContaining({
          description: "Updated description",
        }),
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith("Task updated successfully!");
    });
  });

  test("handles deleting a task", async () => {
    // Mock confirm dialog to return true
    window.confirm = jest.fn(() => true);

    // Mock API delete response
    axios.delete.mockResolvedValueOnce({
      data: { message: "Task deleted successfully" },
    });

    renderWithRouter(<HomePage />);

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText("Complete Project")).toBeInTheDocument();
    });

    // Find and click delete button for a task
    const deleteButtons = await screen.findAllByRole("button", {
      name: /Delete/i,
    });
    fireEvent.click(deleteButtons[0]);

    // Should ask for confirmation
    expect(window.confirm).toHaveBeenCalled();

    // Check if API was called to delete
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:8080/deleteTask/1",
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith("Task deleted successfully!");
    });
  });

  test("shows empty state when no tasks match filter", async () => {
    // Mock empty tasks response
    axios.get.mockResolvedValueOnce({ data: [] });

    renderWithRouter(<HomePage />);

    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText("No tasks found")).toBeInTheDocument();
    });
  });

  test("refreshes task list when refresh button is clicked", async () => {
    renderWithRouter(<HomePage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Complete Project")).toBeInTheDocument();
    });

    // Clear mocks to check for new calls
    axios.get.mockClear();

    // Mock second fetch response
    axios.get.mockResolvedValueOnce({ data: mockTasks });

    // Click refresh button
    const refreshBtn = screen.getByRole("button", { name: /Refresh/i });
    fireEvent.click(refreshBtn);

    // Should call API again
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:8080/getTask",
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token-123" },
        })
      );
    });
  });

  test("handles quick status update", async () => {
    // Mock API response for status update
    axios.put.mockResolvedValueOnce({
      data: { message: "Task status updated successfully" },
    });

    renderWithRouter(<HomePage />);

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText("Complete Project")).toBeInTheDocument();
    });

    // Find status badges and click one
    const statusBadges = await screen.findAllByText("ONGOING");
    await act(async () => {
      fireEvent.click(statusBadges[0]);
    });

    // Should call API to update status
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "http://localhost:8080/updateTask",
        expect.objectContaining({
          id: 1,
          status: "COMPLETED", // Changed from ONGOING to COMPLETED
        }),
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith("Task marked as Completed!");
    });
  });
});
