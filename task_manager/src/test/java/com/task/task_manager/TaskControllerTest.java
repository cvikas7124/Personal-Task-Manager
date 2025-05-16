package com.task.task_manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.task.task_manager.Controller.TaskController;
import com.task.task_manager.DTO.SubTaskDTO;
import com.task.task_manager.DTO.TaskAddDTO;
import com.task.task_manager.DTO.TaskSendDTO;
import com.task.task_manager.DTO.TaskUpdateDTO;
import com.task.task_manager.Model.SubTask;
import com.task.task_manager.Model.Task;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.SubTaskRepo;
import com.task.task_manager.Repo.TaskRepo;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.SubTaskService;
import com.task.task_manager.Service.TaskService;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TaskControllerTest {

    private MockMvc mockMvc;

    @Mock private UserRepo userRepo;
    @Mock private TaskRepo taskRepo;
    @Mock private SubTaskRepo subTaskRepo;
    @Mock private SubTaskService subTaskService;
    @Mock private TaskService taskService;

    @InjectMocks private TaskController taskController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(taskController).build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule()); // Enables LocalDate serialization

        // Mock authenticated user
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("testuser");
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(context);
    }

    @Test
    void testAddTaskSuccess() throws Exception {
        TaskAddDTO dto = new TaskAddDTO("Title", "Description", LocalDate.now().plusDays(1), "10:00 AM", "HIGH", "ONGOING");
        User user = new User();
        user.setUsername("testuser");

        when(userRepo.findByUsername("testuser")).thenReturn(Optional.of(user));
        doNothing().when(taskService).createTask(any(TaskAddDTO.class), any(User.class));

        mockMvc.perform(post("/addTask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Task added successfully"));
    }

    @Test
    void testUpdateTaskSuccess() throws Exception {
        TaskUpdateDTO dto = new TaskUpdateDTO(1L, "Title", "Description", LocalDate.now().plusDays(1), "10:00 AM", "HIGH", "ONGOING");

        doNothing().when(taskService).updateTask(any(TaskUpdateDTO.class), eq("testuser"));

        mockMvc.perform(put("/updateTask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Task updated successfully"));
    }

    @Test
    void testDeleteTaskSuccess() throws Exception {
        Task task = new Task();
        User user = new User();
        user.setUsername("testuser");
        task.setUser(user);

        when(taskRepo.findById(1L)).thenReturn(Optional.of(task));
        doNothing().when(taskService).deleteTask(1L);

        mockMvc.perform(delete("/deleteTask/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Task deleted Successfully"));
    }

    @Test
    void testAddSubTaskSuccess() throws Exception {
        SubTaskDTO dto = new SubTaskDTO(1L, "Subtask Title", "ONGOING");
        Task parentTask = new Task();
        User user = new User();
        user.setUsername("testuser");
        parentTask.setUser(user);

        when(taskRepo.findById(1L)).thenReturn(Optional.of(parentTask));
        doNothing().when(subTaskService).saveSubTask(any(SubTask.class));

        mockMvc.perform(post("/addSubTask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("SubTask added successfully"));
    }

    @Test
    void testDeleteSubTaskSuccess() throws Exception {
        SubTask subTask = new SubTask();
        Task task = new Task();
        User user = new User();
        user.setUsername("testuser");
        task.setUser(user);
        subTask.setTask(task);

        when(subTaskRepo.findById(1L)).thenReturn(Optional.of(subTask));
        doNothing().when(subTaskService).deleteSubTask(1L);

        mockMvc.perform(delete("/deleteSubTask/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("SubTask deleted Successfully"));
    }

    @Test
    void testGetUpcomingTasks() throws Exception {
        TaskSendDTO dto = new TaskSendDTO(1L, "Upcoming Task", "Description", LocalDate.now().plusDays(1), "10:00 AM", "MEDIUM", "ONGOING", List.of());
        when(taskService.getUpcomingTasks("testuser")).thenReturn(List.of(dto));

        mockMvc.perform(get("/getTask"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Upcoming Task"));
    }

    @Test
    void testGetCompletedTasks() throws Exception {
        TaskSendDTO dto = new TaskSendDTO(2L, "Completed Task", "Description", LocalDate.now().minusDays(1), "09:00 AM", "HIGH", "COMPLETED", List.of());
        when(taskService.getCompletedTasks("testuser")).thenReturn(List.of(dto));

        mockMvc.perform(get("/getCompletedTask"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$[0].title").value("Completed Task"));
    }

    @Test
    void testGetOldIncompleteTasks() throws Exception {
        TaskSendDTO dto = new TaskSendDTO(3L, "Old Task", "Old task description", LocalDate.now().minusDays(3), "08:30 AM", "LOW", "ONGOING", List.of());
        when(taskService.getOldOngoingAndIncompleteTasks("testuser")).thenReturn(List.of(dto));

        mockMvc.perform(get("/getOldIncompleteTask"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Old Task"));
    }
}
