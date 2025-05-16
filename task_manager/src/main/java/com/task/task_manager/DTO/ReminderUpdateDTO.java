package com.task.task_manager.DTO;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReminderUpdateDTO(@NotNull (message = "ID is required") Long id,
@NotBlank(message = "Title is required")
String title,
@NotNull(message = "Date is required")
LocalDate date,
@NotBlank(message = "Time is required")
String time,
@NotBlank(message = "Status is required") 
String status) {

}
