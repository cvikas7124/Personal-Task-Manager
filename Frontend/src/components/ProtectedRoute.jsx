import { Navigate } from "react-router-dom"; // Import Navigate component for redirecting users

// This component guards routes that require authentication
const ProtectedRoute = ({ children }) => {
  // Check if user has an authentication token in local storage
  const token = localStorage.getItem("token");

  if (!token) {
    // If no token is found, redirect to login page
    // The "replace" prop replaces the current entry in the history stack
    // This prevents users from using the back button to access protected routes
    return <Navigate to="/login" replace />;
  }

  // If token exists, render the child components (the protected route content)
  return children;
};

export default ProtectedRoute;
