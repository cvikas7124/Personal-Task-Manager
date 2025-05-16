package com.task.task_manager;


import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.task.task_manager.Controller.ChatBotController;
import com.task.task_manager.Service.TaskService;

class ChatBotControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private TaskService taskService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ChatBotController chatBotController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(chatBotController).build();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testuser");
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testChatGreeting() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("message", "hello");

        mockMvc.perform(post("/api/chatbot/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Hello! How can I help you today?"));
    }

    @Test
    void testChatEmptyMessage() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("message", "");

        mockMvc.perform(post("/api/chatbot/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Please type something!"));
    }

    @Test
void testChatTodayTasks() throws Exception {
    Map<String, String> request = new HashMap<>();
    request.put("message", "today's tasks"); // Changed to only use "today" keyword

    Map<String, Long> taskCounts = new HashMap<>();
    taskCounts.put("INCOMPLETE", 2L);
    taskCounts.put("ONGOING", 1L);

    when(taskService.getTodayTaskStatusCounts("testuser")).thenReturn(taskCounts);

    mockMvc.perform(post("/api/chatbot/chat")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reply").value("Today's Tasks\n\n- Incomplete: 2\n- Ongoing: 1\n"));
}

    @Test
void testChatPendingTasks() throws Exception {
    Map<String, String> request = new HashMap<>();
    request.put("message", "pending tasks"); // Changed to only use "pending" keyword

    Map<String, Long> taskCounts = new HashMap<>();
    taskCounts.put("INCOMPLETE", 3L);
    taskCounts.put("ONGOING", 2L);

    when(taskService.getTaskStatusCounts("testuser")).thenReturn(taskCounts);

    mockMvc.perform(post("/api/chatbot/chat")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reply").value(" Tasks To be completed\n\n- Incomplete: 3\n- Ongoing: 2\n"));
}

    @Test
    void testChatHelp() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("message", "help");

        mockMvc.perform(post("/api/chatbot/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("I can assist with creating, viewing, or deleting tasks."));
    }

    @Test
    void testChatUnknownCommand() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("message", "unknown command");

        mockMvc.perform(post("/api/chatbot/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Sorry, I didn't get that. Please ask about tasks."));
    }
}