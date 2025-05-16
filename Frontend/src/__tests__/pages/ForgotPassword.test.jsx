import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import ForgotPassword from "../../pages/ForgotPassword";
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
const renderForgotPasswordPage = () => {
  return render(
    <BrowserRouter>
      <ForgotPassword />
    </BrowserRouter>
  );
};

describe("ForgotPassword Component", () => {
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test("renders forgot password form correctly", () => {
    renderForgotPasswordPage();

    // Check for important elements
    expect(screen.getByText("TickIT")).toBeInTheDocument();
    expect(screen.getByText("Forgot Password")).toBeInTheDocument();
    expect(
      screen.getByText("Enter your email to receive an OTP")
    ).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByText("Email Address")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("example@email.com")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Send OTP/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Remember your password?/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in/i })).toBeInTheDocument();
  });

  test("toggles between light and dark mode", () => {
    renderForgotPasswordPage();

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

    renderForgotPasswordPage();

    // Should show sun icon (indicating dark mode)
    expect(screen.getByRole("button", { name: "🌞" })).toBeInTheDocument();
  });

  test("handles email input change", () => {
    renderForgotPasswordPage();

    const emailInput = screen.getByPlaceholderText("example@email.com");

    // Change email
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");
  });

  test("submits form and redirects on successful OTP send", async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      data: {
        message: "OTP sent successfully",
      },
    });

    renderForgotPasswordPage();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Send OTP/i }));

    await waitFor(() => {
      // Check if API was called with correct data
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:8080/forgetPassword/verifyMail",
        { email: "test@example.com" },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Check if success message is shown
      expect(
        screen.getByText("✅ OTP sent to your email!")
      ).toBeInTheDocument();

      // Check if email was stored in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "userEmail",
        "test@example.com"
      );
    });

    // Fast-forward timers to trigger navigation
    jest.runAllTimers();

    // Check if navigation occurred after timeout
    expect(mockedNavigate).toHaveBeenCalledWith("/verify-otp");
  });

  test("shows error message on failed OTP send", async () => {
    // Mock failed API response
    axios.post.mockRejectedValueOnce({
      response: {
        data: "Email not registered",
      },
    });

    renderForgotPasswordPage();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "nonexistent@example.com" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Send OTP/i }));

    await waitFor(() => {
      // Check if error message is displayed
      expect(screen.getByText("❌ Email not registered")).toBeInTheDocument();

      // Check if navigation did NOT occur
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  test("shows generic error message when server response is unexpected", async () => {
    // Mock network error
    axios.post.mockRejectedValueOnce(new Error("Network Error"));

    renderForgotPasswordPage();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Send OTP/i }));

    await waitFor(() => {
      // Check if error message is displayed
      expect(
        screen.getByText("❌ Something went wrong while sending OTP.")
      ).toBeInTheDocument();

      // Check if navigation did NOT occur
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  test("prevents form submission when email is empty", async () => {
    renderForgotPasswordPage();

    // Submit form without filling the email
    const form = document.querySelector("form");
    fireEvent.submit(form);

    // Check that error message is shown
    await waitFor(() => {
      expect(
        screen.getByText("❌ Please enter your email address")
      ).toBeInTheDocument();
    });

    // API should not be called
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("renders sign in link that navigates to login page", () => {
    renderForgotPasswordPage();

    const signInLink = screen.getByText("Sign in");
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.getAttribute("href")).toBe("/login");
  });
});
