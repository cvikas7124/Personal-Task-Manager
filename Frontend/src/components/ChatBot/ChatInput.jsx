import React, { useState } from "react";
import { motion } from "framer-motion";
import { IoSend } from "react-icons/io5";

const ChatInput = ({ onSendMessage, isDarkMode, currentTheme, isTyping }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isTyping) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form
      className="chat-input-form"
      onSubmit={handleSubmit}
      style={{
        backgroundColor: isDarkMode ? "#1E272C" : "#F8F9FA",
        borderTop: `1px solid ${currentTheme.border}`,
      }}
    >
      <input
        type="text"
        className="chat-input"
        placeholder="Ask me anything about your tasks..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{
          backgroundColor: isDarkMode ? "#455A64" : "#FFFFFF",
          color: currentTheme.text,
          border: `1px solid ${currentTheme.border}`,
          boxShadow: `0 2px 6px ${currentTheme.shadow}`,
        }}
        disabled={isTyping}
      />

      <motion.button
        type="submit"
        className="send-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={!message.trim() || isTyping}
        style={{
          backgroundColor: currentTheme.primary,
          opacity: !message.trim() || isTyping ? 0.7 : 1,
          boxShadow: `0 2px 6px ${currentTheme.shadow}`,
        }}
      >
        <IoSend size={16} color="#FFFFFF" />
      </motion.button>
    </form>
  );
};

export default ChatInput;
