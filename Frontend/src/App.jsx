import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./home/HomePage";
import ForgotPassword from "./pages/ForgotPassword";
import OTPVerification from "./pages/OTPVerification";
import OTPVerification_register from "./pages/OTPVerification_register";
import NewPassword from "./pages/NewPassword";
import LandingPage from "./pages/LandingPage";
import DailyPlanner from "./home/functions/dailyplanner/DailyPlanner";
import Calendar from "./home/functions/calendar/Calendar";
import Pomodoro from "./home/functions/pomodoro/Pomodoro";
import EisenhowerMatrix from "./home/functions/eisenhower_matrix/EisenhowerMatrix";
import Dashboard from "./home/functions/dashboard/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatBot from "./components/ChatBot/ChatBot";

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );
  const location = useLocation();

  // Define paths where ChatBot should NOT appear
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/verify-otp",
    "/new-password",
  ];
  const isPublicPath = publicPaths.includes(location.pathname);

  useEffect(() => {
    // Add event listener for theme changes
    const handleThemeChange = (event) => {
      const { isDarkMode: newDarkMode } = event.detail;
      setIsDarkMode(newDarkMode);
    };

    window.addEventListener("themeChanged", handleThemeChange);

    return () => {
      window.removeEventListener("themeChanged", handleThemeChange);
    };
  }, []);

  return (
    <>
      <Routes>
        {/* Public routes - anyone can access */}
        <Route path="/" element={<LandingPage />} />
        {/* Shows at the root URL (homepage) */}
        <Route path="/login" element={<LoginPage />} /> {/* Login page */}
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/verify-registration-otp"
          element={<OTPVerification_register />}
        /> 
        {/* Sign-up page */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Password recovery step 1 */}
        <Route path="/verify-otp" element={<OTPVerification />} />
        {/* Password recovery step 2 */}
        <Route path="/new-password" element={<NewPassword />} />
        {/* Password recovery step 3 */}
        {/* Protected routes - only accessible if authenticated */}
        <Route
          path="/homepage"
          element={
            <ProtectedRoute>
              <HomePage /> {/* Main task management interface */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard /> {/* Overview with stats and summaries */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily_planner"
          element={
            <ProtectedRoute>
              <DailyPlanner /> {/* Day-by-day planning tool */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar /> {/* Calendar view of tasks */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/pomodoro_clock"
          element={
            <ProtectedRoute>
              <Pomodoro /> {/* Time management tool */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/eisenhower_matrix"
          element={
            <ProtectedRoute>
              <EisenhowerMatrix /> {/* Priority sorting tool */}
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Only render ChatBot on protected routes */}
      {!isPublicPath && <ChatBot isDarkMode={isDarkMode} />}
    </>
  );
};

export default App;
