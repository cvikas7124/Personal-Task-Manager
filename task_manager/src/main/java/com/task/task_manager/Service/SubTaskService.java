package com.task.task_manager.Service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.task.task_manager.DTO.SubTaskDTO;
import com.task.task_manager.Exception.InvalidTaskException;
import com.task.task_manager.Model.SubTask;
import com.task.task_manager.Model.Task;
import com.task.task_manager.Repo.SubTaskRepo;

@Service
public class SubTaskService {

    @Autowired
    private SubTaskRepo subTaskRepo;
     public void saveSubTask(SubTask subTask)
    {
        subTaskRepo.save(subTask);
    }

    public void deleteSubTask(long id)
    {
        subTaskRepo.deleteById(id);
    }

     public void updateTask(SubTaskDTO dto,String username) {
    SubTask subTask = subTaskRepo.findById(dto.id())
            .orElseThrow(() -> new InvalidTaskException("SubTask with ID " + dto.id() + " not found"));
    
     Task task= subTask.getTask();
    if (task == null) {
        throw new InvalidTaskException("SubTask with ID " + dto.id() + " does not belong to any task");
    }
    if (!task.getUser().getUsername().equals(username)) {
        throw new InvalidTaskException("You are not allowed to update this task");
    }           
    subTask.setTitle(dto.title());
    subTask.setStatus(dto.status());

    subTaskRepo.save(subTask);
}
}
