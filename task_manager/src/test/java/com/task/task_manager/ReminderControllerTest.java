package com.task.task_manager;


import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;

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
import com.task.task_manager.Controller.ReminderController;
import com.task.task_manager.DTO.ReminderAddDTO;
import com.task.task_manager.DTO.ReminderSendDTO;
import com.task.task_manager.DTO.ReminderUpdateDTO;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.ReminderService;

class ReminderControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private UserRepo userRepo;

    @Mock
    private ReminderService reminderService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ReminderController reminderController;

    private User testUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(reminderController).build();
        objectMapper.findAndRegisterModules(); // For LocalDate serialization

        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@gmail.com");

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testuser");
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testAddReminderSuccess() throws Exception {
        ReminderAddDTO dto = new ReminderAddDTO(
            "Test Reminder",
            LocalDate.now(),
            "03:00 PM",
            "INCOMPLETE"
        );

        when(userRepo.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        doNothing().when(reminderService).createReminder(any(ReminderAddDTO.class), any(User.class));

        mockMvc.perform(post("/addReminder")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Reminder added successfully"));
    }

    @Test
    void testAddReminderFailsPastDate() throws Exception {
        ReminderAddDTO dto = new ReminderAddDTO(
            "Test Reminder",
            LocalDate.now().minusDays(1),
            "03:00 PM",
            "INCOMPLETE"
        );

        when(userRepo.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        mockMvc.perform(post("/addReminder")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Reminder date should be in the future"));
    }

    @Test
    void testUpdateReminderSuccess() throws Exception {
        ReminderUpdateDTO dto = new ReminderUpdateDTO(
            1L,
            "Updated Title",
            LocalDate.now().plusDays(1),
            "04:00 PM",
            "COMPLETED"
        );

        when(userRepo.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        doNothing().when(reminderService).updateReminder(any(ReminderUpdateDTO.class), any(User.class));

        mockMvc.perform(put("/updateReminder")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Reminder updated successfully"));
    }

    @Test
    void testDeleteReminderSuccess() throws Exception {
        when(userRepo.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        doNothing().when(reminderService).deleteReminder(anyLong(), any(User.class));

        mockMvc.perform(delete("/deleteReminder/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Reminder deleted successfully"));
    }

    @Test
    void testGetReminders() throws Exception {
        ReminderSendDTO reminder1 = new ReminderSendDTO(1L, "Test Reminder 1", LocalDate.now(), "03:00 PM", "INCOMPLETE");
        ReminderSendDTO reminder2 = new ReminderSendDTO(2L, "Test Reminder 2", LocalDate.now().plusDays(1), "04:00 PM", "COMPLETED");
        when(userRepo.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(reminderService.getReminders(any(User.class))).thenReturn(Arrays.asList(reminder1, reminder2));

        mockMvc.perform(get("/getReminder"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}