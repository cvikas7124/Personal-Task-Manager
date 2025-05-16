package com.task.task_manager.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.task.task_manager.Service.TaskService;
@RequestMapping("/api/chatbot")
@RestController
public class ChatBotController {
    private String username;

    @Autowired
    private TaskService taskService;
    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> payload) {
        String userMessage = payload.get("message");
       
        username=SecurityContextHolder.getContext().getAuthentication().getName();
        String reply = generateReply(userMessage);

        return Map.of("reply", reply);
    }

    private String generateReply(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "Please type something!";
        }

        String lower = message.toLowerCase();

        if (lower.contains("hello") || lower.contains("hi")) {
            return "Hello! How can I help you today?";
        }
        else if (lower.contains("create") && lower.contains("task")) {
            return "You can add a task by clicking + button on the Home Page.";
        }
        else if (lower.contains("view") || lower.contains("show")) {
            return "You can view your Peformance on your dashboard.";
        }
        else if (lower.contains("delete") || lower.contains("remove")) {
            return "Click on bin 🗑 to remove a task.";
        }
        else if (lower.contains("help")) {
            return "I can assist with creating, viewing, or deleting tasks.";
        }
        else if (lower.contains("thanks") || lower.contains("thank you")) {
            return "You're welcome! If you have more questions, feel free to ask.";
        }
        else if (lower.contains("bye") || lower.contains("exit")) {
            return "Goodbye! Have a great day!";
        }
        else if(lower.contains("today"))
        {
            Map<String, Long> counts = taskService.getTodayTaskStatusCounts(username);
            return String.format(
            "Today's Tasks\n\n- Incomplete: %d\n- Ongoing: %d\n",
            counts.getOrDefault("INCOMPLETE", 0L),
            counts.getOrDefault("ONGOING", 0L)
          );
        }
        else if(lower.contains("pending") || lower.contains("incomplete") || lower.contains("ongoing") || lower.contains("in progress")){
            Map<String, Long> counts = taskService.getTaskStatusCounts(username);
            return String.format(
                " Tasks To be completed\n\n- Incomplete: %d\n- Ongoing: %d\n",
                counts.getOrDefault("INCOMPLETE", 0L),
                counts.getOrDefault("ONGOING", 0L)
              );
        }
        else if (lower.contains("complete") || lower.contains("done")) {
            return "Check the box to mark a task complete.";
        }
        
        return "Sorry, I didn't get that. Please ask about tasks.";
    }


}
