import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import { MdDashboard, MdInfo, MdTaskAlt, MdTimer, MdAdd } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import ChatToggle from "./ChatToggle";
import "../../styles/ChatBot.css";
import botLogo from "../../assets/chatbot_logo.png";

const ChatBot = ({ isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi there! I'm your TickIT assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // If no token is found, don't render the chatbot
  if (!token) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();

    // Show menu options when chat is first opened
    if (isOpen && messages.length === 1) {
      setTimeout(() => {
        setShowOptions(true);
      }, 500);
    }
  }, [messages, isOpen]);

  const handleToggleChat = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      // Show options when opening chat
      setTimeout(() => {
        setShowOptions(true);
      }, 500);
    }
  };

  // Define menu options
  const menuOptions = [
    {
      id: "info",
      label: "Information",
      icon: <MdInfo size={18} />,
      type: "info",
      response:
        "I can provide information about tasks, reminders, and how to use TickIT. What would you like to know about?",
    },
    {
      id: "create-task",
      label: "Create Task",
      icon: <MdAdd size={18} />,
      type: "action",
      action: "createTask", // Changed from "addTask" to "createTask" to match handler
      response: "I'll help you create a new task. Opening task form now...",
    },
    {
      id: "tasks",
      label: "Manage Tasks",
      icon: <MdTaskAlt size={18} />,
      type: "navigate",
      path: "/homepage",
    },
    {
      id: "dashboard",
      label: "View Dashboard",
      icon: <MdDashboard size={18} />,
      type: "navigate",
      path: "/dashboard",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <FaCalendarAlt size={18} />,
      type: "navigate",
      path: "/calendar",
    },
    {
      id: "pomodoro",
      label: "Pomodoro Clock",
      icon: <MdTimer size={18} />,
      type: "navigate",
      path: "/pomodoro_clock",
    },
  ];

  // Function to create a new task
  const handleCreateTask = () => {
    // Navigate to homepage with a query parameter to open task form
    navigate("/homepage?openTaskForm=true");
    setIsOpen(false); // Close the chatbot
  };

  const handleOptionSelect = (option) => {
    // Add user message for the selected option
    const userMessage = {
      id: messages.length + 1,
      text: option.label,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setShowOptions(false);

    // Handle option based on type
    setTimeout(() => {
      setIsTyping(false);

      if (option.type === "navigate") {
        // Navigation option
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: `Taking you to ${option.label}...`,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);

        // Close chat and navigate after a short delay
        setTimeout(() => {
          setIsOpen(false);
          navigate(option.path);
        }, 1000);
      } else if (option.type === "info") {
        // Information option
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: option.response,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);

        // Show sub-options again after providing information
        setTimeout(() => {
          setShowOptions(true);
        }, 500);
      } else if (option.type === "action" && option.action === "createTask") {
        // Handle create task option
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: option.response,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);

        // Close chat and navigate to create task after a short delay
        setTimeout(() => {
          setIsOpen(false);
          handleCreateTask();
        }, 1000);
      }
    }, 800);
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setShowOptions(false);

    // Check for task creation keywords
    const taskKeywords = ["create task", "add task", "new task", "make task"];
    if (taskKeywords.some((keyword) => text.toLowerCase().includes(keyword))) {
      // If message contains task creation keywords, create a task
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: "I'll help you create a new task. Opening the task form now...",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);

        setTimeout(() => {
          setIsOpen(false);
          handleCreateTask();
        }, 1000);
      }, 800);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/chatbot/chat",
        { message: text },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add slight delay to simulate typing
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: response.data.reply,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);

        // Show menu options again after bot responds
        setTimeout(() => {
          setShowOptions(true);
        }, 1000);
      }, 800);
    } catch (error) {
      console.error("Chatbot error:", error);
      setIsTyping(false);

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: "Sorry, I'm having trouble connecting right now. Please try again later.",
          sender: "bot",
          error: true,
          timestamp: new Date(),
        },
      ]);

      toast.error("Couldn't connect to chatbot service");

      // Show options again even after error
      setTimeout(() => {
        setShowOptions(true);
      }, 500);
    }
  };

  const currentTheme = {
    background: isDarkMode ? "#263238" : "#F9FAFB",
    chatBg: isDarkMode ? "#37474F" : "#FFFFFF",
    headerBg: isDarkMode ? "#1E272C" : "#4A6FA5",
    text: isDarkMode ? "#E0E0E0" : "#333333",
    mutedText: isDarkMode ? "#B0BEC5" : "#6c757d",
    border: isDarkMode ? "#455A64" : "#e0e0e0",
    primary: isDarkMode ? "#4A6FA5" : "#4A6FA5", // Slate Blue
    secondary: isDarkMode ? "#607D8B" : "#B0BEC5", // Bluish gray
    success: isDarkMode ? "#4DB6AC" : "#4DB6AC", // Light Teal
    danger: isDarkMode ? "#FF6B6B" : "#FF6B6B", // Bright Coral
    warning: isDarkMode ? "#FFD54F" : "#FFD54F", // Muted Gold
    info: isDarkMode ? "#2979FF" : "#2979FF", // Electric Blue
    accent: isDarkMode ? "#7E57C2" : "#7E57C2", // Accent Purple
    shadow: isDarkMode ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.1)",
    cardBg: isDarkMode ? "#37474F" : "#FFFFFF",
  };

  return (
    <>
      <ChatToggle
        isOpen={isOpen}
        onClick={handleToggleChat}
        isDarkMode={isDarkMode}
        currentTheme={currentTheme}
        botLogo={botLogo}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-container"
            style={{
              backgroundColor: currentTheme.chatBg,
              border: `1px solid ${currentTheme.border}`,
              boxShadow: `0 8px 30px ${currentTheme.shadow}`,
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="chatbot-header"
              style={{
                backgroundColor: currentTheme.headerBg,
                color: "#FFFFFF",
                boxShadow: `0 2px 10px ${currentTheme.shadow}`,
              }}
            >
              <div className="d-flex align-items-center">
                <div className="chatbot-avatar">
                  <img
                    src={botLogo}
                    alt="Bot Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                <div>
                  <h5 className="mb-0">TickIT Assistant</h5>
                  <small>Ask me anything about your tasks!</small>
                </div>
              </div>
              <button
                className="close-button"
                onClick={handleToggleChat}
                style={{ color: "#FFFFFF" }}
              >
                <IoClose size={20} />
              </button>
            </div>

            <div
              className="chatbot-messages"
              style={{
                backgroundColor: currentTheme.chatBg,
              }}
            >
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  isDarkMode={isDarkMode}
                  currentTheme={currentTheme}
                  botLogo={botLogo}
                />
              ))}

              {isTyping && (
                <div
                  className="chat-bubble bot-bubble typing-bubble"
                  style={{
                    backgroundColor: isDarkMode ? "#455A64" : "#F0F2F5",
                    color: currentTheme.text,
                  }}
                >
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              {showOptions && !isTyping && (
                <div className="chat-options-container">
                  <div
                    className="options-title"
                    style={{ color: currentTheme.mutedText }}
                  >
                    I can help you with:
                  </div>
                  <div className="chat-options">
                    {menuOptions.map((option) => (
                      <motion.button
                        key={option.id}
                        className="chat-option-button"
                        onClick={() => handleOptionSelect(option)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          backgroundColor: currentTheme.primary,
                          color: "#FFFFFF",
                          boxShadow: `0 2px 4px ${currentTheme.shadow}`,
                          borderBottom:
                            option.id === menuOptions.length - 1
                              ? "none"
                              : `1px solid rgba(255,255,255,0.1)`,
                        }}
                      >
                        <span className="option-icon">{option.icon}</span>
                        <span className="option-text">{option.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <ChatInput
              onSendMessage={sendMessage}
              isDarkMode={isDarkMode}
              currentTheme={currentTheme}
              isTyping={isTyping}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
