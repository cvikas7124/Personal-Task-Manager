package com.task.task_manager.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PasswordRequest(@NotBlank(message = "Email is required") 
@Email(message = "Please provide a valid email address") String email,

@NotBlank(message = "newPassword is required") 
@Pattern(
        regexp = "^(?=.*[0-9])(?=.*[a-zA-Z]).{3,}$",
        message = "Password must be at least 3 characters long and contain at least one letter and one number"
    )
String newPassword,


@NotBlank(message = "confirmPassword is required")
@Pattern(
        regexp = "^(?=.*[0-9])(?=.*[a-zA-Z]).{3,}$",
        message = "Password must be at least 3 characters long and contain at least one letter and one number"
    )
String confirmPassword) {

}
