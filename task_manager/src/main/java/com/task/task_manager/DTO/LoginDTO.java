package com.task.task_manager.DTO;

import jakarta.validation.constraints.NotBlank;

public record LoginDTO(
@NotBlank(message = "Username is required")    
String username,
@NotBlank(message = "Password is required")
String password) {

}
