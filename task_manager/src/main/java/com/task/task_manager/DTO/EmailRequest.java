package com.task.task_manager.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;


public record EmailRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        String email) {
} 
