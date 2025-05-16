import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import NewPassword from "../../pages/NewPassword";
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
const renderNewPasswordPage = () => {
  return render(
    <BrowserRouter>
      <NewPassword />
    </BrowserRouter>
  );
};

describe("NewPassword Component", () => {
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

  test("renders new password form correctly", () => {
    renderNewPasswordPage();

    // Check for important elements
    expect(screen.getByText("TickIT")).toBeInTheDocument();
    expect(screen.getByText("Set New Password")).toBeInTheDocument();
    expect(screen.getByText("Enter a strong new password")).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByText("New Password")).toBeInTheDocument();
    expect(screen.getByText("Confirm Password")).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Enter new password")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Confirm new password")
    ).toBeInTheDocument();

    // Check for password visibility toggle buttons
    expect(screen.getAllByRole("button", { name: "Show" })).toHaveLength(2);

    // Check for Reset button
    expect(
      screen.getByRole("button", { name: /Reset Password/i })
    ).toBeInTheDocument();

    // Check for "Remember your password?" text and Sign in link
    expect(screen.getByText(/Remember your password?/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });

  test("toggles between light and dark mode", () => {
    renderNewPasswordPage();

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

    renderNewPasswordPage();

    // Should show sun icon (indicating dark mode)
    expect(screen.getByRole("button", { name: "🌞" })).toBeInTheDocument();
  });

  test("toggles new password visibility", () => {
    renderNewPasswordPage();

    const passwordInput = screen.getByPlaceholderText("Enter new password");
    expect(passwordInput).toHaveAttribute("type", "password");

    // Get the show button for the password field
    const showPasswordBtn = screen.getAllByRole("button", { name: "Show" })[0];

    // Click to show password
    fireEvent.click(showPasswordBtn);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Click to hide password
    expect(showPasswordBtn).toHaveTextContent("Hide");
    fireEvent.click(showPasswordBtn);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("toggles confirm password visibility", () => {
    renderNewPasswordPage();

    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirm new password"
    );
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Get the show button for the confirm password field
    const showConfirmPasswordBtn = screen.getAllByRole("button", {
      name: "Show",
    })[1];

    // Click to show password
    fireEvent.click(showConfirmPasswordBtn);
    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    // Click to hide password
    expect(showConfirmPasswordBtn).toHaveTextContent("Hide");
    fireEvent.click(showConfirmPasswordBtn);
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  test("shows password strength indicator", () => {
    renderNewPasswordPage();

    const passwordInput = screen.getByPlaceholderText("Enter new password");

    // Type a short password (weak)
    fireEvent.change(passwordInput, { target: { value: "123" } });
    expect(screen.getByText("Weak")).toBeInTheDocument();

    // Type a medium-length password
    fireEvent.change(passwordInput, { target: { value: "123456" } });
    expect(screen.getByText("Medium")).toBeInTheDocument();

    // Type a long password (strong)
    fireEvent.change(passwordInput, { target: { value: "1234567890" } });
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  test("shows password match indicator", () => {
    renderNewPasswordPage();

    const passwordInput = screen.getByPlaceholderText("Enter new password");
    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirm new password"
    );

    // Type different passwords
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "different" } });
    expect(screen.getByText("✗ Passwords don't match")).toBeInTheDocument();

    // Type matching passwords
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });
    expect(screen.getByText("✓ Passwords match")).toBeInTheDocument();
  });

  test("shows error when passwords don't match", async () => {
    renderNewPasswordPage();

    // Fill form with non-matching passwords
    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "different" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    // Check if error message is displayed
    expect(screen.getByText("❌ Passwords do not match.")).toBeInTheDocument();

    // API should not be called
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("shows error when no email is found", async () => {
    // Mock missing email in localStorage
    localStorageMock.getItem.mockImplementation(() => null);

    renderNewPasswordPage();

    // Fill form with matching passwords
    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "password123" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    // Check if error message is displayed
    expect(
      screen.getByText("❌ No email found. Please restart the process.")
    ).toBeInTheDocument();

    // API should not be called
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("submits form and redirects on successful password reset", async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      data: {
        message: "Password reset successfully",
      },
    });

    renderNewPasswordPage();

    // Fill form with matching passwords
    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "newpassword123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "newpassword123" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    await waitFor(() => {
      // Check if API was called with correct data
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:8080/forgetPassword/changePassword",
        {
          email: "test@example.com",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Check if success message is shown
      expect(
        screen.getByText("✅ Password reset successfully!")
      ).toBeInTheDocument();
    });

    // Fast-forward timers to trigger navigation
    jest.runAllTimers();

    // Check if userEmail was removed from localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("userEmail");

    // Check if navigation occurred to login page
    expect(mockedNavigate).toHaveBeenCalledWith("/login");
  });

  test("shows error message on failed password reset", async () => {
    // Mock failed API response
    axios.post.mockRejectedValueOnce({
      response: {
        data: "Password must be at least 6 characters",
      },
    });

    renderNewPasswordPage();

    // Fill form with matching passwords
    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "short" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    await waitFor(() => {
      // Check if error message is displayed
      expect(
        screen.getByText("❌ Password must be at least 6 characters")
      ).toBeInTheDocument();

      // Check if navigation did NOT occur
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  test("renders sign in link that navigates to login page", () => {
    renderNewPasswordPage();

    const signInLink = screen.getByRole("link", { name: "Sign in" });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.getAttribute("href")).toBe("/login");
  });
});
