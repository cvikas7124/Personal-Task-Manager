package com.task.task_manager.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.task.task_manager.DTO.ReminderAddDTO;
import com.task.task_manager.DTO.ReminderSendDTO;
import com.task.task_manager.DTO.ReminderUpdateDTO;
import com.task.task_manager.Exception.AccessDeniedException;
import com.task.task_manager.Exception.RemindersNotFoundException;
import com.task.task_manager.Model.Reminder;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.ReminderRepo;

@Service
public class ReminderService {
  
    @Autowired
    private ReminderRepo reminderRepo;
    
    public void createReminder(ReminderAddDTO reminderDTO, User user) {
                
           Reminder reminder=new Reminder();
            reminder.setTitle(reminderDTO.title());
            reminder.setDate(reminderDTO.date());
            reminder.setTime(LocalTime.parse(reminderDTO.time(), DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)));
            reminder.setStatus(reminderDTO.status());
            reminder.setUser(user);
            reminderRepo.save(reminder);
    }

    public void updateReminder(ReminderUpdateDTO reminderDTO, User user) {
        Reminder reminder = reminderRepo.findById(reminderDTO.id())
                .orElseThrow(() -> new RemindersNotFoundException("Reminder with ID " + reminderDTO.id() + " not found"));
        
        reminder.setTitle(reminderDTO.title());
        reminder.setDate(reminderDTO.date());
        reminder.setTime(LocalTime.parse(reminderDTO.time(), DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)));
        reminder.setStatus(reminderDTO.status());
        reminder.setUser(user);
        
        reminderRepo.save(reminder);
    }

    public void deleteReminder(long id, User user){
        Reminder reminder = reminderRepo.findById(id)
                .orElseThrow(() -> new RemindersNotFoundException("Reminder with ID " + id + " not found"));
                if (!reminder.getUser().equals(user)) {
                    throw new AccessDeniedException("You do not have permission to delete this reminder");
                }
        reminderRepo.delete(reminder);
    }

    public List<ReminderSendDTO> getReminders(User user) {
        List<Reminder> reminders = reminderRepo
            .findByUserAndStatusAndDateGreaterThanEqualOrderByDateAscTimeAsc(user, "INCOMPLETE", LocalDate.now());
    
        if (reminders.isEmpty()) {
            throw new RemindersNotFoundException("No reminders found for the user");
        }
    
        return reminders.stream()
            .map(reminder -> new ReminderSendDTO(
                reminder.getId(),
                reminder.getTitle(),
                reminder.getDate(), // assuming your entity field is `date`
                reminder.getTime().format(DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)), // assuming field is `time`
                reminder.getStatus()
            ))
            .collect(Collectors.toList());
    }
    
}

