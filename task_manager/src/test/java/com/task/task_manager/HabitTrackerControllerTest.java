package com.task.task_manager;


import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
import com.task.task_manager.Controller.HabitTrackerController;
import com.task.task_manager.DTO.HabitTrackerAddDTO;
import com.task.task_manager.DTO.HabitTrackerSendDTO;
import com.task.task_manager.DTO.HabitTrackerUpdateDTO;
import com.task.task_manager.Exception.GlobalExceptionHandler;
import com.task.task_manager.Model.HabitTracker;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.HabitTrackerRepo;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.HabitTrackerService;

class HabitTrackerControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private UserRepo userRepo;

    @Mock
    private HabitTrackerRepo habitTrackerRepo;

    @Mock
    private HabitTrackerService habitTrackerService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private HabitTrackerController habitTrackerController;

    private User testUser;
    private HabitTracker testHabit;

    @BeforeEach
    void setUp() {
         MockitoAnnotations.openMocks(this);
    mockMvc = MockMvcBuilders.standaloneSetup(habitTrackerController)
        .setControllerAdvice(new GlobalExceptionHandler())  // Add exception handler
        .build();

        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@gmail.com");

        testHabit = new HabitTracker();
        testHabit.setId(1L);
        testHabit.setTitle("Test Habit");
        testHabit.setStatus("INCOMPLETE");
        testHabit.setUser(testUser);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testuser");
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testAddHabitSuccess() throws Exception {
        HabitTrackerAddDTO dto = new HabitTrackerAddDTO("Test Habit");
        
        when(userRepo.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        doNothing().when(habitTrackerService).createHabit(any(HabitTrackerAddDTO.class), any(User.class));

        mockMvc.perform(post("/addHabit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Task added successfully"));
    }

    @Test
    void testUpdateHabitSuccess() throws Exception {
        HabitTrackerUpdateDTO dto = new HabitTrackerUpdateDTO(1L, "Updated Habit", "COMPLETED");
        
        when(userRepo.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        doNothing().when(habitTrackerService).updateHabit(any(HabitTrackerUpdateDTO.class), any(User.class));

        mockMvc.perform(put("/updateHabit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Task added successfully"));
    }

    @Test
    void testUpdateHabitInvalidStatus() throws Exception {
        HabitTrackerUpdateDTO dto = new HabitTrackerUpdateDTO(1L, "Updated Habit", "INVALID");

        mockMvc.perform(put("/updateHabit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(" Daily Task status should be either COMPLETED or INCOMPLETED"));
    }

    @Test
    void testDeleteHabitSuccess() throws Exception {
        when(habitTrackerRepo.findById(1L)).thenReturn(Optional.of(testHabit));
        doNothing().when(habitTrackerService).deleteTask(1L);

        mockMvc.perform(delete("/deleteHabit/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Task deleted Successfully"));
    }

    @Test
    void testGetHabits() throws Exception {
        HabitTrackerSendDTO habit1 = new HabitTrackerSendDTO(1L, "Habit 1", "INCOMPLETE");
        HabitTrackerSendDTO habit2 = new HabitTrackerSendDTO(2L, "Habit 2", "COMPLETED");

        when(habitTrackerService.getTodayHabits("testuser"))
                .thenReturn(Arrays.asList(habit1, habit2));

        mockMvc.perform(get("/getHabit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Habit 1"))
                .andExpect(jsonPath("$[1].title").value("Habit 2"));
    }

    @Test
void testDeleteHabitUnauthorized() throws Exception {
    HabitTracker unauthorizedHabit = new HabitTracker();
    User otherUser = new User();
    otherUser.setUsername("otheruser");
    unauthorizedHabit.setUser(otherUser);

    when(habitTrackerRepo.findById(1L)).thenReturn(Optional.of(unauthorizedHabit));

    mockMvc.perform(delete("/deleteHabit/1"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("You are not allowed to delete this task"));
}
}