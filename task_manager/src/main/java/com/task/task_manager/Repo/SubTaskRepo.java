package com.task.task_manager.Repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.task.task_manager.Model.SubTask;

public interface SubTaskRepo extends JpaRepository<SubTask,Long>{

}
