package com.task.task_manager.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.task.task_manager.DTO.SubTaskDTO;
import com.task.task_manager.DTO.TaskAddDTO;
import com.task.task_manager.DTO.TaskSendDTO;
import com.task.task_manager.DTO.TaskUpdateDTO;
import com.task.task_manager.Exception.InvalidTaskException;
import com.task.task_manager.Exception.NoOldIncompleteTasksException;
import com.task.task_manager.Exception.NoUpcomingTasksException;
import com.task.task_manager.Model.Task;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.TaskRepo;


@Service
public class TaskService {

     @Autowired
     private TaskRepo taskRepo;

    public void saveTask(Task task)
    {
        taskRepo.save(task);
    }

    public void deleteTask(long id)
    {
        taskRepo.deleteById(id);
    }

    public void createTask(TaskAddDTO dto, User user) {
        Task task = new Task();
        task.setTitle(dto.title());
        task.setDescription(dto.description());
        task.setDueDate(dto.dueDate());
        
        // Parse the time string into LocalTime using the correct format
        task.setTimeToComplete(LocalTime.parse(dto.time(), DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)));
        
        task.setPriority(dto.priority());
        task.setStatus(dto.status());
        task.setUser(user);
        
        // Save the task to the repository
        taskRepo.save(task);
    }
    

   public void updateTask(TaskUpdateDTO dto,String username) {
    Task task = taskRepo.findById(dto.id())
            .orElseThrow(() -> new InvalidTaskException("Task with ID " + dto.id() + " not found"));
    if (!task.getUser().getUsername().equals(username)) {
        throw new InvalidTaskException("You are not allowed to update this task");
    }
    task.setTitle(dto.title());
    task.setDescription(dto.description());
    task.setDueDate(dto.dueDate());
    task.setTimeToComplete(LocalTime.parse(dto.time(), DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)));
    task.setPriority(dto.priority());
    task.setStatus(dto.status());

    taskRepo.save(task);
}
  
public List<TaskSendDTO> getUpcomingTasks(String username) {
    LocalDate yesterday = LocalDate.now().minusDays(1);
    List<Task> tasks = taskRepo.findRecentAndUpcomingTasks(yesterday, username);

    if (tasks.isEmpty()) {
        throw new NoUpcomingTasksException("No upcoming tasks found for user: " + username);
    }

    return tasks.stream()
    .map(task -> new TaskSendDTO(
        task.getId(),
        task.getTitle(),
        task.getDescription(),
        task.getDueDate(),
        task.getTimeToComplete().format(DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)),
        task.getPriority(),
        task.getStatus(),
        task.getSubTasks().stream()
            .map(subTask -> new SubTaskDTO(
                subTask.getId(),
                subTask.getTitle(),
                subTask.getStatus()
            ))
            .collect(Collectors.toList())
    ))
    .collect(Collectors.toList());

}

public List<TaskSendDTO> getCompletedTasks(String username) {
    LocalDate sevenDagAgo = LocalDate.now().minusDays(7);
    List<Task> tasks = taskRepo.findCompletedTasksFromLastSevenDays(sevenDagAgo, username);

    if (tasks.isEmpty()) {
        throw new NoUpcomingTasksException("No Completed tasks found for user: " + username);
    }

    return tasks.stream()
    .map(task -> new TaskSendDTO(
        task.getId(),
        task.getTitle(),
        task.getDescription(),
        task.getDueDate(),
        task.getTimeToComplete().format(DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)),
        task.getPriority(),
        task.getStatus(),
        task.getSubTasks().stream()
            .map(subTask -> new SubTaskDTO(
                subTask.getId(),
                subTask.getTitle(),
                subTask.getStatus()
            ))
            .collect(Collectors.toList())
    ))
    .collect(Collectors.toList());

}
public List<TaskSendDTO> getOldOngoingAndIncompleteTasks(String username) {
    LocalDate endDate = LocalDate.now().minusDays(1); 
    LocalDate startDate = endDate.minusDays(7); 

    List<Task> tasks = taskRepo.findOldOngoingAndIncompleteTasks(startDate, endDate, username);

    if (tasks.isEmpty()) {
        throw new NoOldIncompleteTasksException("No tasks found between " + startDate + " and " + endDate.minusDays(1));
    }

    return tasks.stream()
        .map(task -> new TaskSendDTO(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getDueDate(),
            task.getTimeToComplete().format(DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)),
            task.getPriority(),
            task.getStatus(),
            task.getSubTasks().stream()
                .map(subTask -> new SubTaskDTO(
                    subTask.getId(),
                    subTask.getTitle(),
                    subTask.getStatus()
                ))
                .collect(Collectors.toList())
        ))
        .collect(Collectors.toList());
}

public Map<String, Long> getTaskStatusCounts(String username) {
    LocalDate today = LocalDate.now(); // <-- changed here
    Long incomplete = taskRepo.countPendingTasks(username, today);
    Long ongoing = taskRepo.countOngoingTasks(username, today);

    Map<String, Long> counts = new HashMap<>();
    counts.put("INCOMPLETE", incomplete);   // <-- Capital keys
    counts.put("ONGOING", ongoing);
    return counts;
}

public Map<String, Long> getTodayTaskStatusCounts(String username) {
    Long incomplete = taskRepo.countTodayPendingTasks(username);
    Long ongoing = taskRepo.countTodayOngoingTasks(username);

    Map<String, Long> counts = new HashMap<>();
    counts.put("INCOMPLETE", incomplete);   // <-- Capital keys
    counts.put("ONGOING", ongoing);
    return counts;
}




}
