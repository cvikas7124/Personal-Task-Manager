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
import com.task.task_manager.DTO.HabitTrackerAddDTO;
import com.task.task_manager.DTO.HabitTrackerSendDTO;
import com.task.task_manager.DTO.HabitTrackerUpdateDTO;
import com.task.task_manager.Exception.AccessDeniedException;
import com.task.task_manager.Exception.ResourceNotFoundException;
import com.task.task_manager.Exception.UserNotFoundException;
import com.task.task_manager.Model.HabitTracker;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.HabitTrackerRepo;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.HabitTrackerService;

import jakarta.validation.Valid;

@RestController
public class HabitTrackerController {
 
    @Autowired
    private UserRepo userRepo;

    @Autowired
    private HabitTrackerRepo habitTrackerRepo;
    
    @Autowired
    private HabitTrackerService habitTrackerService;
    
    @LogActivity("Created a new Habit")
    @PostMapping("/addHabit")
    public ResponseEntity<?> addTask(@Valid @RequestBody HabitTrackerAddDTO dto) {
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        habitTrackerService.createHabit(dto, user);
        return ResponseEntity.ok("Task added successfully");
    }

    @LogActivity("Updated a Habit")
    @PutMapping("/updateHabit")
    public ResponseEntity<?> updateHabit(@Valid @RequestBody HabitTrackerUpdateDTO dto) {

        if (!(dto.status().equals("COMPLETED") || dto.status().equals("INCOMPLETED"))) {
            return ResponseEntity.badRequest().body(" Daily Task status should be either COMPLETED or INCOMPLETED");
        }
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        habitTrackerService.updateHabit(dto, user);
        return ResponseEntity.ok("Task added successfully");
    }

    @LogActivity("Deleted a Habit")
      @DeleteMapping("/deleteHabit/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable long id)
    {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        HabitTracker habitTracker = habitTrackerRepo.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

    if (!habitTracker.getUser().getUsername().equals(username)) {
        throw new AccessDeniedException("You are not allowed to delete this task");
    }

       habitTrackerService.deleteTask(id);
       return ResponseEntity.ok("Task deleted Successfully");

    }

    @GetMapping("/getHabit")
    public ResponseEntity<?> getUpcomingTasks() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<HabitTrackerSendDTO> tasks = habitTrackerService.getTodayHabits(username);
        return ResponseEntity.ok(tasks);
    
    }
}
