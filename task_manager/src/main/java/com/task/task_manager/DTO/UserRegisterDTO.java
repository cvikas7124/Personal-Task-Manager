package com.task.task_manager.DTO;

import jakarta.persistence.Column;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserRegisterDTO( @NotBlank(message = "Name is required")
    @Size(min = 3, message = "Username should be at least 3 characters long")
    @Pattern(regexp = "^[a-zA-Z0-9._-]{3,}$", message = "Username should only contain letters, numbers, dots, underscores, or hyphens")
    @Column(unique = true, nullable = false)
     String username,

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Column(unique = true,nullable = false)
     String email,

    @NotBlank(message = "Password is required")
    @NotBlank(message = "Password is required")
    @Size(min = 3, message = "Password should be at least 3 characters long")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-zA-Z]).{3,}$", message = "Password must contain at least one letter and one number")
    @Column(nullable = false)
    String password) {

}
