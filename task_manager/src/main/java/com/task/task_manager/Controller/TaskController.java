package com.task.task_manager.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.task.task_manager.Annotation.LogActivity;
import com.task.task_manager.DTO.SubTaskDTO;
import com.task.task_manager.DTO.TaskAddDTO;
import com.task.task_manager.DTO.TaskSendDTO;
import com.task.task_manager.DTO.TaskUpdateDTO;
import com.task.task_manager.Exception.AccessDeniedException;
import com.task.task_manager.Exception.ResourceNotFoundException;
import com.task.task_manager.Exception.UserNotFoundException;
import com.task.task_manager.Model.SubTask;
import com.task.task_manager.Model.Task;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.SubTaskRepo;
import com.task.task_manager.Repo.TaskRepo;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.SubTaskService;
import com.task.task_manager.Service.TaskService;

import jakarta.validation.Valid;

@RestController
public class TaskController {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private TaskRepo taskRepo;

    @Autowired
    private SubTaskService subTaskService;
    @Autowired
    private SubTaskRepo subTaskRepo;
    @Autowired
    private TaskService taskService;

    @LogActivity("Created a new task")
    @PostMapping("/addTask")
    public ResponseEntity<?> addTask(@Valid @RequestBody TaskAddDTO dto) {

        System.out.println("Received priority: " + dto.priority());
        if (!(dto.priority().equals("LOW") || dto.priority().equals("MEDIUM") || dto.priority().equals("HIGH"))) {
            return ResponseEntity.badRequest().body("Priority should be either LOW, MEDIUM, or HIGH");
        }
        if (!(dto.status().equals("COMPLETED") || dto.status().equals("INCOMPLETE") || dto.status().equals("ONGOING"))) {
            return ResponseEntity.badRequest().body("Task status should be either COMPLETED, INCOMPLETE, or ONGOING");
        }
       
       
        if (dto.dueDate().isBefore(java.time.LocalDate.now())) {
            return ResponseEntity.badRequest().body("Task start date should be in the future");
        }
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        taskService.createTask(dto, user);
        return ResponseEntity.ok("Task added successfully");
    }
    @LogActivity("Updated a task")
    @PutMapping("/updateTask")
    public ResponseEntity<?> updateTask(@Valid @RequestBody TaskUpdateDTO dto) {
       
        if (!(dto.status().equals("COMPLETED") || dto.status().equals("INCOMPLETE") || dto.status().equals("ONGOING"))) {
            return ResponseEntity.badRequest().body("Task status should be either COMPLETED, INCOMPLETE, or ONGOING");
        }
        if (!(dto.priority().equals("LOW") || dto.priority().equals("MEDIUM") || dto.priority().equals("HIGH"))) {
            return ResponseEntity.badRequest().body("Priority should be either LOW, MEDIUM, or HIGH");
        }
        if(dto.dueDate().isBefore(java.time.LocalDate.now().minusDays(1))) {
            return ResponseEntity.badRequest().body("Task Due date should be in the future");
        }
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        taskService.updateTask(dto, username);
        return ResponseEntity.ok("Task updated successfully");
    }
    @LogActivity("Deleted a Task")
    @DeleteMapping("/deleteTask/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable long id)
    {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Task task = taskRepo.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

            
        if (!task.getUser().getUsername().equals(username)) {
            throw new AccessDeniedException("You are not allowed to delete this task");
        }

       taskService.deleteTask(id);
       return ResponseEntity.ok("Task deleted Successfully");

    }


    @LogActivity("Created a new Subtask")
    @PostMapping("/addSubTask")
    public ResponseEntity<?> addSubTask(@Valid @RequestBody SubTaskDTO subTaskDTO) {
        
        if (!(subTaskDTO.status().equals("COMPLETED") || subTaskDTO.status().equals("INCOMPLETE") || subTaskDTO.status().equals("ONGOING"))) {
            return ResponseEntity.badRequest().body("Task status should be either COMPLETED, INCOMPLETE, or ONGOING");
        }
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName(); 
        Task task=taskRepo.findById(subTaskDTO.id()).orElseThrow(()-> new ResourceNotFoundException("No Parent Task Exists "));
        
        if (!task.getUser().getUsername().equals(username)) {
            throw new AccessDeniedException("You are not allowed to add this task");
        }
        SubTask subTask =new SubTask();
        subTask.setTitle(subTaskDTO.title());
        subTask.setStatus(subTaskDTO.status());
        subTask.setTask(task);
        subTaskService.saveSubTask(subTask);
        return ResponseEntity.ok("SubTask added successfully");
    }
    @LogActivity("Updated a Subtask")
    @PutMapping("/updateSubTask")
    public ResponseEntity<?> updateSubTask(@Valid @RequestBody SubTaskDTO dto) {

        if (!(dto.status().equals("COMPLETED") || dto.status().equals("INCOMPLETE") || dto.status().equals("ONGOING"))) {
            return ResponseEntity.badRequest().body("Task status should be either COMPLETED, INCOMPLETE, or ONGOING");
        }
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        subTaskService.updateTask(dto, username);
        return ResponseEntity.ok("SubTask updated successfully");
    }

    @LogActivity("Deletd a Subtask")
    @DeleteMapping("/deleteSubTask/{id}")
    public ResponseEntity<?> deleteSubTask(@PathVariable long id)
    {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        SubTask subTask = subTaskRepo.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("SubTask not found"));

        Task task = subTask.getTask();
    if (!task.getUser().getUsername().equals(username)) {
        throw new AccessDeniedException("You are not allowed to delete this task");
    }

       subTaskService.deleteSubTask(id);
       return ResponseEntity.ok("SubTask deleted Successfully");

    }
   
    @GetMapping("/getTask")
    public ResponseEntity<?> getUpcomingTasks() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<TaskSendDTO> tasks = taskService.getUpcomingTasks(username);
        return ResponseEntity.ok(tasks);
    
    }
    @GetMapping("/getCompletedTask")
    public ResponseEntity<?> getCompletedTasks() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<TaskSendDTO> tasks = taskService.getCompletedTasks(username);
        return ResponseEntity.ok(tasks);
    
    }

    @GetMapping("/getOldIncompleteTask")
    public ResponseEntity<?> getIncompleteTasks() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<TaskSendDTO> tasks = taskService.getOldOngoingAndIncompleteTasks(username);
        return ResponseEntity.ok(tasks);
    
    }
}
