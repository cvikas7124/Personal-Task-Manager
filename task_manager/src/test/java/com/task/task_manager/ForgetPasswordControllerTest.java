package com.task.task_manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.task.task_manager.Controller.ForgetPasswordController;
import com.task.task_manager.DTO.EmailRequest;
import com.task.task_manager.DTO.OtpRequest;
import com.task.task_manager.DTO.PasswordRequest;
import com.task.task_manager.Model.ForgetPassword;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.ActivityLogRepo;
import com.task.task_manager.Repo.ForgetPasswordRepo;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.EmailService;
import com.task.task_manager.Service.ForgetPasswordService;
import com.task.task_manager.Service.UserService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Date;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ForgetPasswordControllerTest {

    private MockMvc mockMvc;

    @Mock private UserRepo userRepo;
    @Mock private EmailService emailService;
    @Mock private UserService userService;
    @Mock private ForgetPasswordRepo forgetPasswordRepo;
    @Mock private ForgetPasswordService forgetPasswordService;
    @Mock private ActivityLogRepo activityLogRepo;

    @InjectMocks private ForgetPasswordController controller;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User testUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        testUser = new User();
        testUser.setEmail("test@gmail.com");
        testUser.setUsername("testuser");
    }

    @Test
    void testVerifyMailSuccess() throws Exception {
        EmailRequest request = new EmailRequest("test@gmail.com");

        when(userRepo.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
        doNothing().when(forgetPasswordService).deleteByUser(testUser);

        mockMvc.perform(post("/forgetPassword/verifyMail")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Email sent for verification"));
    }

    @Test
    void testVerifyOtpSuccess() throws Exception {
        OtpRequest request = new OtpRequest("test@gmail.com", 123456);
        ForgetPassword fp = new ForgetPassword();
        fp.setExpirationTime(new Date(System.currentTimeMillis() + 10000)); // valid
        fp.setOtpVerified(false);

        when(userRepo.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
        when(forgetPasswordRepo.findByOtpAndUser(123456, testUser)).thenReturn(Optional.of(fp));

        mockMvc.perform(post("/forgetPassword/verifyOtp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("OTP verified"));
    }

    @Test
    void testChangePasswordSuccess() throws Exception {
        PasswordRequest request = new PasswordRequest("test@gmail.com", "newPass1", "newPass1");
        ForgetPassword fp = new ForgetPassword();
        fp.setOtpVerified(true);

        when(userRepo.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
        when(forgetPasswordRepo.findByUser(testUser)).thenReturn(Optional.of(fp));

        mockMvc.perform(post("/forgetPassword/changePassword")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Password Updated"));
    }
}
