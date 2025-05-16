import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const ChatBubble = ({ message, isDarkMode, currentTheme, botLogo }) => {
  const isBot = message.sender === "bot";

  // Format the timestamp for display
  const formattedTime = format(new Date(message.timestamp), "h:mm a");

  // Handle multiline text properly
  const formattedText = message.text.split("\n").map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < message.text.split("\n").length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <motion.div
      className={`chat-message ${isBot ? "bot-message" : "user-message"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {isBot && (
        <div className="bot-avatar-small">
          <img
            src={botLogo}
            alt="Bot"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      <div className="message-content">
        <div
          className={`chat-bubble ${isBot ? "bot-bubble" : "user-bubble"} ${
            message.error ? "error-bubble" : ""
          }`}
          style={{
            backgroundColor: isBot
              ? message.error
                ? isDarkMode
                  ? "#5C2B29"
                  : "#FEEBEE"
                : isDarkMode
                ? "#455A64"
                : "#F0F2F5"
              : currentTheme.primary,
            color: isBot ? currentTheme.text : "#FFFFFF",
            boxShadow: `0 2px 4px ${currentTheme.shadow}`,
            whiteSpace: "pre-wrap", // Add this to preserve text formatting
          }}
        >
          <div className="message-text">{formattedText}</div>
          <div
            className="message-timestamp"
            style={{
              color: isBot
                ? isDarkMode
                  ? "#9E9E9E"
                  : "#6c757d"
                : "rgba(255, 255, 255, 0.8)",
            }}
          >
            {formattedTime}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatBubble;
