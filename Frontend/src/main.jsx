import React from "react";
import ReactDOM from "react-dom/client"; // Tool for rendering React components in the browser
import App from "./App"; // Our main application component
import { BrowserRouter } from "react-router-dom"; // Tool for handling page navigation in the app
import "bootstrap/dist/css/bootstrap.min.css"; // Loads Bootstrap CSS for styling
import "./index.css"; // Loads our custom CSS styles

// This is where our React app actually starts
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {" "}
    {/* Development mode for finding potential problems */}
    <BrowserRouter>
      {" "}
      {/* Sets up our app to handle different pages/URLs */}
      <App />
      {/* Renders our main app component */}
    </BrowserRouter>
  </React.StrictMode>
);
