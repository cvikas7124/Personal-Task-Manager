package com.task.task_manager.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.task.task_manager.DTO.HabitTrackerAddDTO;
import com.task.task_manager.DTO.HabitTrackerSendDTO;
import com.task.task_manager.DTO.HabitTrackerUpdateDTO;
import com.task.task_manager.Exception.HabitNotFoundException;
import com.task.task_manager.Exception.UserNotFoundException;
import com.task.task_manager.Model.HabitTracker;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.HabitTrackerRepo;
import com.task.task_manager.Repo.UserRepo;

@Service
public class HabitTrackerService {

    @Autowired
    private HabitTrackerRepo habitTrackerRepo;

    @Autowired
    private UserRepo userRepo;

    public void createHabit(HabitTrackerAddDTO dto, User user) {
        
           HabitTracker habitTracker=new HabitTracker();
           habitTracker.setTitle(dto.title());
           habitTracker.setStatus("INCOMPLETE");
           habitTracker.setDate(LocalDate.now());
           habitTracker.setUser(user);

           habitTrackerRepo.save(habitTracker);
    }

    public void updateHabit(HabitTrackerUpdateDTO dto, User user) {
        HabitTracker habitTracker = habitTrackerRepo.findById(dto.id())
                .orElseThrow(() -> new HabitNotFoundException("Daily Task with ID " + dto.id() + " not found"));

        habitTracker.setTitle(dto.title());
        habitTracker.setStatus(dto.status());
        habitTracker.setUser(user);

        habitTrackerRepo.save(habitTracker);
    }

    public void deleteTask(long id) {
        habitTrackerRepo.deleteById(id);
    }

    public List<HabitTrackerSendDTO> getTodayHabits(String username) {
    LocalDate today = LocalDate.now();
    User user = userRepo.findByUsername(username)
            .orElseThrow(() -> new UserNotFoundException("User not found"));

    List<HabitTracker> habits = habitTrackerRepo.findByUserAndDate(user, today);

    return habits.stream()
            .map(h -> new HabitTrackerSendDTO(h.getId(), h.getTitle(), h.getStatus()))
            .collect(Collectors.toList());
}

 
    
}
