package com.task.task_manager.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OtpRequest(
@Email(message = "Please provide a valid email address")
@NotBlank(message = "Email is required")    
String email,

@NotNull(message = "OTP is required")
@Min(value = 100000, message = "OTP must be 6 digits")
@Max(value = 999999, message = "OTP must be 6 digits")
Integer otp) {

}
