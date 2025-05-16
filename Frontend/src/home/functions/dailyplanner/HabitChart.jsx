import React from "react";
import {
  PieChart, // Container for the pie chart visualization
  Pie, // The actual pie chart component
  Cell, // Individual segments of the pie
  Tooltip, // Shows details when hovering over segments
  Legend, // Chart legend for segment labels
  ResponsiveContainer, // Ensures chart is responsive
} from "recharts";
import { motion } from "framer-motion"; // For animations

const HabitChart = ({ completedHabits, totalHabits, isDarkMode }) => {
  // Set colors based on theme mode
  const COLORS = isDarkMode ? ["#4DB6AC", "#333333"] : ["#00C49F", "#FF8042"]; // [completed, remaining]

  // Calculate remaining habits (prevent negative values)
  const remainingHabits = Math.max(0, totalHabits - completedHabits);

  // Main chart data
  const chartData = [
    { name: "Completed", value: completedHabits || 0 },
    { name: "Remaining", value: remainingHabits || 0 },
  ];

  // If no habits exist, show example data (empty chart looks broken)
  const displayData =
    totalHabits === 0 ? [{ name: "No Data", value: 1 }] : chartData;

  // Custom tooltip that matches the current theme
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && totalHabits > 0) {
      return (
        <div
          style={{
            backgroundColor: isDarkMode ? "#1E1E1E" : "#fff", // Dark/light background
            border: `1px solid ${isDarkMode ? "#444" : "#ddd"}`, // Dark/light border
            padding: "8px 12px",
            borderRadius: "4px",
            color: isDarkMode ? "#e0e0e0" : "#333", // Dark/light text
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <p className="mb-0" style={{ color: payload[0].color }}>
            <strong>{`${payload[0].name}: ${payload[0].value}`}</strong>
          </p>
        </div>
      );
    }
    return null; // Don't show tooltip if conditions aren't met
  };

  return (
    <motion.div
      style={{
        width: "100%",
        height: 230, // Fixed height for chart
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      initial={{ opacity: 0, scale: 0.9 }} // Start invisible and smaller
      animate={{ opacity: 1, scale: 1 }} // Appear and grow to normal size
      transition={{ duration: 0.7 }} // Animation takes 0.7 seconds
    >
      <h5
        style={{
          color: isDarkMode ? "#4DB6AC" : "#195283", // Teal in dark mode, blue in light
          marginBottom: "8px",
          fontWeight: "600",
          alignSelf: "flex-start",
        }}
      >
        Daily Overview
      </h5>

      {/* Show a message when there are no habits */}
      {totalHabits === 0 && (
        <div
          className="text-center my-3"
          style={{
            color: isDarkMode ? "#aaa" : "#888", // Light gray in both modes
            fontSize: "0.9rem",
            fontStyle: "italic",
          }}
        >
          Add tasks to see your statistics
        </div>
      )}

      {/* Responsive chart container */}
      <ResponsiveContainer>
        <PieChart>
          <Pie
            dataKey="value" // The property to measure in the chart
            data={displayData}
            cx="50%" // Center horizontally
            cy="50%" // Center vertically
            outerRadius={70} // Size of the chart
            innerRadius={totalHabits === 0 ? 50 : 30} // Make it a donut chart
            label={totalHabits > 0} // Only show labels when there's data
            paddingAngle={totalHabits > 0 ? 2 : 0} // Space between segments
            animationDuration={1500} // Animation time
            animationBegin={300} // Delay before animation starts
          >
            {totalHabits === 0 ? (
              // Single gray cell when no data
              <Cell fill={isDarkMode ? "#444" : "#ddd"} />
            ) : (
              // Color cells based on data (completed/remaining)
              displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  strokeWidth={1}
                />
              ))
            )}
          </Pie>
          <Tooltip content={<CustomTooltip />} /> {/* Custom styled tooltips */}
          {/* Only show legend when there's data */}
          {totalHabits > 0 && (
            <Legend
              verticalAlign="bottom" // Legend at bottom
              iconType="circle" // Use circles for legend items
              formatter={(value) => (
                <span style={{ color: isDarkMode ? "#ccc" : "#555" }}>
                  {value}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default HabitChart;
