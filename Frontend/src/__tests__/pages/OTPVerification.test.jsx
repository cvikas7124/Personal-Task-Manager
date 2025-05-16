import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import OTPVerification from "../../pages/OTPVerification";
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
  let store = {
    userEmail: "test@example.com", // Pre-populate with test email
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

// Mock setTimeout
jest.useFakeTimers();

// Helper to render with router context
const renderOTPVerificationPage = () => {
  return render(
    <BrowserRouter>
      <OTPVerification />
    </BrowserRouter>
  );
};

describe("OTPVerification Component", () => {
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
    // Ensure userEmail is set for each test
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "userEmail") return "test@example.com";
      if (key === "theme") return null;
      return null;
    });
  });

  test("renders OTP verification form correctly", () => {
    renderOTPVerificationPage();

    // Check for important elements
    expect(screen.getByText("TickIT")).toBeInTheDocument();
    expect(screen.getByText("OTP Verification")).toBeInTheDocument();
    expect(screen.getByText(/Enter the OTP sent to/i)).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();

    // Check for OTP input fields (should be 6)
    const otpInputs = screen.getAllByRole("textbox");
    expect(otpInputs).toHaveLength(6);

    // Check for Verify button
    expect(
      screen.getByRole("button", { name: /Verify OTP/i })
    ).toBeInTheDocument();

    // Check for "Didn't receive" text and Resend link
    expect(screen.getByText(/Didn't receive the OTP?/i)).toBeInTheDocument();
    expect(screen.getByText("Resend OTP")).toBeInTheDocument();
    expect(screen.getByText("Resend OTP").closest("a")).toHaveAttribute(
      "href",
      "/forgot-password"
    );
  });

  test("toggles between light and dark mode", () => {
    renderOTPVerificationPage();

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
      if (key === "userEmail") return "test@example.com";
      return null;
    });

    renderOTPVerificationPage();

    // Should show sun icon (indicating dark mode)
    expect(screen.getByRole("button", { name: "🌞" })).toBeInTheDocument();
  });

  test("automatically focuses first input on load", () => {
    // Mock document.activeElement
    const originalActiveElement = document.activeElement;

    renderOTPVerificationPage();

    // Get all OTP inputs
    const otpInputs = screen.getAllByRole("textbox");

    // Check if first input is focused
    expect(otpInputs[0]).toHaveFocus();

    // Clean up
    if (originalActiveElement) {
      originalActiveElement.focus();
    }
  });

  test("handles OTP input and auto-focuses next input", () => {
    renderOTPVerificationPage();

    const otpInputs = screen.getAllByRole("textbox");

    // Type in first input and check if it moves to the next input
    fireEvent.change(otpInputs[0], { target: { value: "1" } });
    expect(otpInputs[1]).toHaveFocus();

    // Type in second input
    fireEvent.change(otpInputs[1], { target: { value: "2" } });
    expect(otpInputs[2]).toHaveFocus();

    // Ensure values are set correctly
    expect(otpInputs[0].value).toBe("1");
    expect(otpInputs[1].value).toBe("2");
  });

  test("handles backspace key to move to previous input", () => {
    renderOTPVerificationPage();

    const otpInputs = screen.getAllByRole("textbox");

    // Focus the second input
    otpInputs[1].focus();

    // Press backspace on empty input - should move focus back to first input
    fireEvent.keyDown(otpInputs[1], { key: "Backspace" });
    expect(otpInputs[0]).toHaveFocus();
  });

  test("doesn't allow non-numeric input", () => {
    renderOTPVerificationPage();

    const otpInputs = screen.getAllByRole("textbox");

    // Try entering a letter
    fireEvent.change(otpInputs[0], { target: { value: "a" } });

    // Input should remain empty
    expect(otpInputs[0].value).toBe("");
  });

  test("shows error when submitting incomplete OTP", async () => {
    renderOTPVerificationPage();

    // Fill only 3 digits
    const otpInputs = screen.getAllByRole("textbox");
    fireEvent.change(otpInputs[0], { target: { value: "1" } });
    fireEvent.change(otpInputs[1], { target: { value: "2" } });
    fireEvent.change(otpInputs[2], { target: { value: "3" } });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    // Should show error message
    await waitFor(() => {
      expect(
        screen.getByText("❌ Please enter all 6 digits of the OTP")
      ).toBeInTheDocument();
    });

    // API should not be called
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("submits form with complete OTP and redirects on success", async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      data: {
        message: "OTP verified successfully",
      },
    });

    renderOTPVerificationPage();

    // Fill all 6 digits
    const otpInputs = screen.getAllByRole("textbox");
    fireEvent.change(otpInputs[0], { target: { value: "1" } });
    fireEvent.change(otpInputs[1], { target: { value: "2" } });
    fireEvent.change(otpInputs[2], { target: { value: "3" } });
    fireEvent.change(otpInputs[3], { target: { value: "4" } });
    fireEvent.change(otpInputs[4], { target: { value: "5" } });
    fireEvent.change(otpInputs[5], { target: { value: "6" } });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    await waitFor(() => {
      // Check if API was called with correct data
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:8080/forgetPassword/verifyOtp",
        {
          email: "test@example.com",
          otp: "123456",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Check if success message is shown
      expect(
        screen.getByText("✅ OTP verified successfully!")
      ).toBeInTheDocument();
    });

    // Fast-forward timers to trigger navigation
    jest.runAllTimers();

    // Check if navigation occurred to new password page
    expect(mockedNavigate).toHaveBeenCalledWith("/new-password");
  });

  test("shows error message on invalid OTP", async () => {
    // Mock failed API response
    axios.post.mockRejectedValueOnce({
      response: {
        data: "Invalid OTP",
      },
    });

    renderOTPVerificationPage();

    // Fill all 6 digits
    const otpInputs = screen.getAllByRole("textbox");
    fireEvent.change(otpInputs[0], { target: { value: "9" } });
    fireEvent.change(otpInputs[1], { target: { value: "9" } });
    fireEvent.change(otpInputs[2], { target: { value: "9" } });
    fireEvent.change(otpInputs[3], { target: { value: "9" } });
    fireEvent.change(otpInputs[4], { target: { value: "9" } });
    fireEvent.change(otpInputs[5], { target: { value: "9" } });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    await waitFor(() => {
      // Check if error message is displayed
      expect(
        screen.getByText("❌ Invalid OTP. Please try again.")
      ).toBeInTheDocument();
    });

    // Check navigation didn't occur
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  test("renders resend OTP link with correct navigation", () => {
    renderOTPVerificationPage();

    const resendLink = screen.getByText("Resend OTP");
    expect(resendLink).toBeInTheDocument();
    expect(resendLink.closest("a")).toHaveAttribute("href", "/forgot-password");
  });
});
