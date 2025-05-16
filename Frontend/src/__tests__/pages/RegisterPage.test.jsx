import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import RegisterPage from "../../pages/RegisterPage";
import "@testing-library/jest-dom";

// Mock axios
jest.mock("axios");

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock setTimeout
jest.useFakeTimers();

// Helper to render with router context
const renderRegisterPage = () => {
  return render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  );
};

describe("RegisterPage Component", () => {
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test("renders registration form correctly", () => {
    renderRegisterPage();

    // Check for important elements
    expect(screen.getByText("TickIT")).toBeInTheDocument();
    expect(screen.getByText("Create an account")).toBeInTheDocument();
    expect(screen.getByText("Enter your details below")).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByText("Confirm Password")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Your username")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("example@gmail.com")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repeat password")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Sign up/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Already have an account?/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in/i })).toBeInTheDocument();
  });

  test("toggles between light and dark mode", () => {
    renderRegisterPage();

    // Initially in light mode
    expect(screen.getByRole("button", { name: "🌙" })).toBeInTheDocument();

    // Toggle to dark mode
    fireEvent.click(screen.getByRole("button", { name: "🌙" }));

    // Should show sun icon in dark mode
    expect(screen.getByRole("button", { name: "🌞" })).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "dark");

    // Toggle back to light mode
    fireEvent.click(screen.getByRole("button", { name: "🌞" }));

    // Should show moon icon in light mode
    expect(screen.getByRole("button", { name: "🌙" })).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "light");
  });

  test("loads dark theme from localStorage", () => {
    // Set dark theme in localStorage
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "theme") return "dark";
      return null;
    });

    renderRegisterPage();

    // Should show sun icon (indicating dark mode)
    expect(screen.getByRole("button", { name: "🌞" })).toBeInTheDocument();
  });

  test("toggles password visibility", () => {
    renderRegisterPage();

    // Password field
    const passwordInput = screen.getByPlaceholderText("Enter password");
    expect(passwordInput).toHaveAttribute("type", "password");

    // Toggle password visibility
    const showPasswordBtn = screen.getAllByText("Show")[0];
    fireEvent.click(showPasswordBtn);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Toggle back to hidden
    expect(showPasswordBtn).toHaveTextContent("Hide");
    fireEvent.click(showPasswordBtn);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("toggles confirm password visibility", () => {
    renderRegisterPage();

    // Confirm password field
    const confirmPasswordInput = screen.getByPlaceholderText("Repeat password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Get the second "Show" button (for confirm password)
    const showButtons = screen.getAllByText("Show");
    const confirmPasswordButton = showButtons[1];

    // Click to show password
    fireEvent.click(confirmPasswordButton);
    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    // Now the button text has changed to "Hide"
    // Check that the button now says "Hide"
    expect(confirmPasswordButton).toHaveTextContent("Hide");

    // Click again to hide password
    fireEvent.click(confirmPasswordButton);
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  test("handles form input changes", () => {
    renderRegisterPage();

    const usernameInput = screen.getByPlaceholderText("Your username");
    const emailInput = screen.getByPlaceholderText("example@gmail.com");
    const passwordInput = screen.getByPlaceholderText("Enter password");
    const confirmPasswordInput = screen.getByPlaceholderText("Repeat password");

    // Change username
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    expect(usernameInput.value).toBe("testuser");

    // Change email
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");

    // Change password
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    expect(passwordInput.value).toBe("password123");

    // Change confirm password
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });
    expect(confirmPasswordInput.value).toBe("password123");
  });

  test("shows error when passwords don't match", async () => {
    renderRegisterPage();

    // Fill form with mismatching passwords
    fireEvent.change(screen.getByPlaceholderText("Your username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText("example@gmail.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), {
      target: { value: "different" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    // Check if error message about passwords is displayed
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();

    // Axios should not be called
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("shows error when fields are empty", async () => {
    renderRegisterPage();

    // Get the form
    const form = document.querySelector("form");
    form.onsubmit = jest.fn((e) => e.preventDefault());

    // Submit form without filling anything
    fireEvent.submit(form);

    // Check if validation message is displayed
    await waitFor(() => {
      expect(
        screen.getByText("Please fill in all fields.")
      ).toBeInTheDocument();
    });

    // Axios should not be called
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("submits form and redirects on successful registration", async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      data: {
        message: "User registered successfully",
      },
    });

    renderRegisterPage();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText("Your username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText("example@gmail.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), {
      target: { value: "password123" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      // Check if API was called with correct data
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:8080/register",
        {
          username: "testuser",
          email: "test@example.com",
          password: "password123",
        }
      );

      // Check if success message is shown
      expect(
        screen.getByText("✅ Registered successfully!")
      ).toBeInTheDocument();
    });

    // Fast-forward timers to trigger navigation
    jest.runAllTimers();

    // Check if navigation occurred after timeout
    expect(mockedNavigate).toHaveBeenCalledWith("/login");
  });

  test("shows error message on failed registration", async () => {
    // Mock failed API response
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          username: "Username already exists",
          email: "Email already in use",
        },
      },
    });

    renderRegisterPage();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText("Your username"), {
      target: { value: "existinguser" },
    });
    fireEvent.change(screen.getByPlaceholderText("example@gmail.com"), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), {
      target: { value: "password123" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      // Check if error message is displayed
      expect(
        screen.getByText(/❌ Username already exists/)
      ).toBeInTheDocument();
      expect(screen.getByText(/❌ Email already in use/)).toBeInTheDocument();

      // Check if navigation did NOT occur
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  test("shows generic error message when server response is unexpected", async () => {
    // Mock network error
    axios.post.mockRejectedValueOnce(new Error("Network Error"));

    renderRegisterPage();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText("Your username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText("example@gmail.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), {
      target: { value: "password123" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      // Check if error message is displayed
      expect(screen.getByText(/❌ Network Error/)).toBeInTheDocument();
    });
  });

  test("renders sign in link that navigates to login page", () => {
    renderRegisterPage();

    const signInLink = screen.getByRole("link", { name: /Sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.getAttribute("href")).toBe("/login");
  });
});
