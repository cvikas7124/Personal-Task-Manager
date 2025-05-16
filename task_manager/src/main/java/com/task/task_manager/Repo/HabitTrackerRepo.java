package com.task.task_manager.Repo;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.task.task_manager.Model.HabitTracker;
import com.task.task_manager.Model.User;

@Repository
public interface HabitTrackerRepo extends JpaRepository<HabitTracker,Long>{
        List<HabitTracker> findByUserAndDate(User user, LocalDate date);

}
