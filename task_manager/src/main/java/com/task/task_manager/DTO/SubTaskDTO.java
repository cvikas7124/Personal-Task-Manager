package com.task.task_manager.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubTaskDTO(
@NotNull(message = "ID is required")    
Long id,
@NotBlank(message = "Title is required")
String title,
@NotBlank(message = "Status is required")
String status) {

}
