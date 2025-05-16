package com.task.task_manager.Controller;

import org.springframework.web.bind.annotation.RestController;

import com.task.task_manager.Annotation.LogActivity;
import com.task.task_manager.DTO.ReminderAddDTO;
import com.task.task_manager.DTO.ReminderUpdateDTO;
import com.task.task_manager.Exception.UserNotFoundException;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.ReminderService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;



@RestController
public class ReminderController {
        
    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ReminderService reminderService;

    @LogActivity("Created a new Reminder")
    @PostMapping("/addReminder")
    public ResponseEntity<?> addReminder(@Valid @RequestBody ReminderAddDTO reminderDTO) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName(); 
        User user = userRepo.findByUsername(username).orElseThrow(() -> new UserNotFoundException("User not found"));
        if (!(reminderDTO.status().equals("COMPLETED") || reminderDTO.status().equals("INCOMPLETE"))) {
            return ResponseEntity.badRequest().body(" Daily Task status should be either COMPLETED or INCOMPLETED");
        }
        if (reminderDTO.date().isBefore(java.time.LocalDate.now())) {
            return ResponseEntity.badRequest().body("Reminder date should be in the future");
        }
        
        reminderService.createReminder(reminderDTO, user);
        return ResponseEntity.ok("Reminder added successfully");
    }

    @LogActivity("Updated a Reminder")
    @PutMapping("/updateReminder")
    public ResponseEntity<?> updateReminder(@Valid @RequestBody ReminderUpdateDTO reminderDTO) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName(); 
        User user = userRepo.findByUsername(username).orElseThrow(() -> new UserNotFoundException("User not found"));
        if (!(reminderDTO.status().equals("COMPLETED") || reminderDTO.status().equals("INCOMPLETE"))) {
            return ResponseEntity.badRequest().body(" Daily Task status should be either COMPLETED or INCOMPLETED");
        }
        if (reminderDTO.date().isBefore(java.time.LocalDate.now())) {
            return ResponseEntity.badRequest().body("Reminder date should be in the future");
        }
        reminderService.updateReminder(reminderDTO, user);
        return ResponseEntity.ok("Reminder updated successfully");
    }

    @LogActivity("Deleted a Reminder")
    @DeleteMapping("/deleteReminder/{id}")
    public ResponseEntity<?> deleteReminder(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName(); 
        User user = userRepo.findByUsername(username).orElseThrow(() -> new UserNotFoundException("User not found"));
       
        reminderService.deleteReminder(id, user);
        return ResponseEntity.ok("Reminder deleted successfully");
    }

    @GetMapping("/getReminder")
    public ResponseEntity<?> getReminder() {

        String username = SecurityContextHolder.getContext().getAuthentication().getName(); 
        User user = userRepo.findByUsername(username).orElseThrow(() -> new UserNotFoundException("User not found"));
        
        return ResponseEntity.ok(reminderService.getReminders(user));
    }
    
}
