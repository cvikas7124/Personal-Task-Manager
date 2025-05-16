package com.task.task_manager.DTO;

import jakarta.validation.constraints.NotBlank;



public record HabitTrackerAddDTO(
@NotBlank(message = "Title is required")    
String title) {

}
