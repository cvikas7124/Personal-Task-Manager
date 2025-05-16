package com.task.task_manager.Repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.task.task_manager.Model.ActivityLog;

public interface ActivityLogRepo extends JpaRepository<ActivityLog, Long> {
    

}
