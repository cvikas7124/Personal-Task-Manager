package com.task.task_manager.Repo;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.task.task_manager.Model.Reminder;
import com.task.task_manager.Model.User;

public interface ReminderRepo extends JpaRepository<Reminder, Long> {
    
    List<Reminder> findByUser(User user);
    List<Reminder> findByUserAndStatusAndDateGreaterThanEqualOrderByDateAscTimeAsc(
    User user, String status, LocalDate date);
}
