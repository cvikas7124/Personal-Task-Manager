package com.task.task_manager.DTO;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record TaskUpdateDTO(
    @NotNull(message = "Id is required")
    Long id,          
    @NotBlank(message = "Title is required")
    String title,
    @NotBlank(message = "Description is required")
    String description,
    @NotNull(message = "Due date is required")
    LocalDate dueDate,
    @NotBlank(message = "Time is required")
    @Pattern(regexp = "^(0[1-9]|1[0-2]):([0-5]\\d)\\s([APap][Mm])$", message = "Time must be in hh:mm a format (e.g., 03:30 PM)")
    String time,
    @NotBlank(message = "Priority is required")
    String priority,
    @NotBlank(message = "Status is required")
    String status
) {
}
