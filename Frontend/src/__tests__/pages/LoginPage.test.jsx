import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import LoginPage from "../../pages/LoginPage";
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

// Helper to render with router context
const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe("LoginPage Component", () => {
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test("renders login form correctly", () => {
    renderLoginPage();

    // Check for important elements
    expect(screen.getByText("TickIT")).toBeInTheDocument();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Please enter your details")).toBeInTheDocument();
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your username")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your password")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign in/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign up/i })).toBeInTheDocument();
  });

  test("toggles between light and dark mode", () => {
    renderLoginPage();

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

    renderLoginPage();

    // Should show sun icon (indicating dark mode)
    expect(screen.getByRole("button", { name: "🌞" })).toBeInTheDocument();
  });

  test("toggles password visibility", () => {
    renderLoginPage();

    const passwordInput = screen.getByPlaceholderText("Enter your password");
    expect(passwordInput).toHaveAttribute("type", "password");

    // Toggle password visibility
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    // Toggle back to hidden
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("handles form input changes", () => {
    renderLoginPage();

    const usernameInput = screen.getByPlaceholderText("Enter your username");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    // Change username
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    expect(usernameInput.value).toBe("testuser");

    // Change password
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    expect(passwordInput.value).toBe("password123");
  });

  test("submits form and redirects on successful login", async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      data: {
        accessToken: "fake-token-123",
        username: "testuser",
        email: "test@example.com",
      },
    });

    renderLoginPage();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText("Enter your username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "password123" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      // Check if API was called with correct data
      expect(axios.post).toHaveBeenCalledWith("http://localhost:8080/login", {
        username: "testuser",
        password: "password123",
      });

      // Check if values were stored in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "token",
        "fake-token-123"
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "username",
        "testuser"
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "email",
        "test@example.com"
      );

      // Check if navigation occurred
      expect(mockedNavigate).toHaveBeenCalledWith("/homepage");
    });

    // Error message should not be displayed
    expect(screen.queryByText(/Login failed/i)).not.toBeInTheDocument();
  });

  test("shows error message on failed login", async () => {
    // Mock failed API response
    axios.post.mockRejectedValueOnce({
      response: {
        data: "Invalid credentials",
      },
    });

    renderLoginPage();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText("Enter your username"), {
      target: { value: "wronguser" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "wrongpass" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      // Check if error message is displayed
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument();

      // Check if navigation did NOT occur
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  test("renders forgot password link", () => {
    renderLoginPage();

    const forgotPasswordLink = screen.getByText(/Forgot password\?/i);
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink.getAttribute("href")).toBe("/forgot-password");
  });

  test("renders sign up link", () => {
    renderLoginPage();

    const signUpLink = screen.getByText(/Sign up/i);
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink.getAttribute("href")).toBe("/register");
  });
});
