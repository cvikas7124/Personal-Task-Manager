import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import LandingPage from "../../pages/LandingPage";

// Simple mock for TypingEffect component
jest.mock("../../components/TypingEffect", () => "mock-typing-effect");

// Mock the IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    this.callback([{ isIntersecting: true }]);
  }
  unobserve() {}
  disconnect() {}
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Helper function to render with router
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("LandingPage Component", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "theme") return "light";
      return null;
    });
  });

  test("renders without crashing", () => {
    renderWithRouter(<LandingPage />);

    // Test if the component renders
    expect(document.body).toBeInTheDocument();
  });
});
