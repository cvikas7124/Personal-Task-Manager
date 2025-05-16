import React from "react";
import { motion } from "framer-motion";
import { IoClose } from "react-icons/io5";

const ChatToggle = ({ isOpen, onClick, isDarkMode, currentTheme, botLogo }) => {
  return (
    <motion.button
      className="chat-toggle-button"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        backgroundColor: isOpen ? "#FF6B6B" : currentTheme.primary,
        boxShadow: `0 4px 10px ${currentTheme.shadow}`,
        border: `1px solid ${
          isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
        }`,
      }}
    >
      {isOpen ? (
        <IoClose size={24} color="#FFFFFF" />
      ) : (
        <img
          src={botLogo}
          alt="Chat Bot"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
          }}
        />
      )}
    </motion.button>
  );
};

export default ChatToggle;
