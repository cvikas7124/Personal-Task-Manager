package com.task.task_manager.DTO;

import java.time.LocalDate;
import java.util.List;

public record TaskSendDTO(
    long id,
    String title,
    String description,
    LocalDate dueDate,
    String time,
    String priority,
    String status,
    List<SubTaskDTO> subTasks
) {
}
