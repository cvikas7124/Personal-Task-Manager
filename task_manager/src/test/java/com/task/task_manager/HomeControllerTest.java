package com.task.task_manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.task.task_manager.Controller.HomeController;
import com.task.task_manager.DTO.LoginDTO;
import com.task.task_manager.DTO.UserRegisterDTO;
import com.task.task_manager.Model.ActivityLog;
import com.task.task_manager.Model.MailBody;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.ActivityLogRepo;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.EmailService;
import com.task.task_manager.Service.JwtService;
import com.task.task_manager.Service.RedisService;
import com.task.task_manager.Service.UserService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class HomeControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserRepo userRepo;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserService userService;

    @Mock
    private EmailService emailService;

    @Mock
    private ActivityLogRepo activityLogRepo;

    @Mock
    private RedisService redisService;

    @InjectMocks
    private HomeController homeController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(homeController)
                .defaultResponseCharacterEncoding(StandardCharsets.UTF_8)
                .build();
    }

    @Test
    void testRegisterSuccess() throws Exception {
        UserRegisterDTO dto = new UserRegisterDTO("testuser", "testuser@gmail.com", "testpass123");

        // Mock dependencies for checking existing user/email
        when(userRepo.findByUsername(dto.username())).thenReturn(Optional.empty());
        when(userRepo.findByEmail(dto.email())).thenReturn(Optional.empty());
        
        // Mock Redis service - OTP should not exist yet
        when(redisService.getOtp(dto.email())).thenReturn(null);
        
        // Mock the save operation
        doNothing().when(redisService).saveUserOtp(eq(dto.email()), anyString(), anyString(), anyInt());
        doNothing().when(emailService).sendHtmlMessage(any(MailBody.class));

        mockMvc.perform(post("/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("OTP sent to your email. Please verify."));

        // Verify Redis operations
        verify(redisService).getOtp(dto.email());
        verify(redisService).saveUserOtp(eq(dto.email()), anyString(), anyString(), eq(2));
        
        // Verify email was sent
        verify(emailService).sendHtmlMessage(any(MailBody.class));
        
        // Verify user was NOT saved yet (happens after OTP verification)
        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void testRegisterFailsDueToInvalidEmailDomain() throws Exception {
        UserRegisterDTO dto = new UserRegisterDTO("testuser", "testuser@yahoo.com", "testpass21");

        mockMvc.perform(post("/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Please provide a valid Gmail address"));

        verify(userService, never()).saveUser(any(User.class));
        verify(emailService, never()).sendHtmlMessage(any(MailBody.class));
    }

    @Test
    void testLoginSuccess() throws Exception {
        LoginDTO dto = new LoginDTO("testuser", "testpass");
        User mockUser = new User();
        mockUser.setUsername("testuser");
        mockUser.setEmail("testuser@gmail.com");

        when(userRepo.findByUsername(dto.username())).thenReturn(Optional.of(mockUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null); // Authentication passes
        when(jwtService.generateAccessToken(dto.username())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(dto.username())).thenReturn("refresh-token");

        mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("testuser@gmail.com"));
    }

    @Test
    void testLoginFailure() throws Exception {
        LoginDTO dto = new LoginDTO("wronguser", "wrongpass");

        when(userRepo.findByUsername(dto.username())).thenReturn(Optional.empty());
        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));

        mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(content().string("Invaild username password"));
    }

    @Test
    void testVerifyOtpSuccess() throws Exception {
        // Setup test data
        String email = "test@gmail.com";
        String otp = "123456";
        String userJson = "{\"username\":\"testuser\",\"email\":\"test@gmail.com\",\"password\":\"testpass123\"}";

        // Mock Redis operations
        when(redisService.getOtp(email)).thenReturn(otp);
        when(redisService.getTempUser(email)).thenReturn(userJson);
        when(userRepo.findByUsername("testuser")).thenReturn(Optional.empty());
        when(userRepo.findByEmail(email)).thenReturn(Optional.empty());
        doNothing().when(redisService).deleteOtp(email);
        doNothing().when(redisService).deleteTempUser(email);
        doNothing().when(emailService).sendHtmlMessage(any(MailBody.class));

        Map<String, String> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("otp", otp);

        mockMvc.perform(post("/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(content().string("Email verified and user registered successfully."));

        verify(userService).saveUser(any(User.class));
        verify(emailService).sendHtmlMessage(any(MailBody.class));
        verify(redisService).deleteOtp(email);
        verify(redisService).deleteTempUser(email);
        verify(activityLogRepo).save(any(ActivityLog.class));
    }

    @Test
    void testVerifyOtpInvalidOTP() throws Exception {
        String email = "test@gmail.com";
        String otp = "123456";
        
        // Mock Redis to return different OTP
        when(redisService.getOtp(email)).thenReturn("654321");

        Map<String, String> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("otp", otp);

        mockMvc.perform(post("/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid OTP."));

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void testVerifyOtpExpiredOTP() throws Exception {
        String email = "test@gmail.com";
        String otp = "123456";
        
        // Mock Redis to return null (expired OTP)
        when(redisService.getOtp(email)).thenReturn(null);

        Map<String, String> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("otp", otp);

        mockMvc.perform(post("/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isGone())
                .andExpect(content().string("OTP expired or not requested."));

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void testVerifyOtpWithMissingData() throws Exception {
        Map<String, String> payload = new HashMap<>();
        payload.put("email", "test@gmail.com");
        // Missing OTP

        mockMvc.perform(post("/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Email and OTP are required."));

        verify(userService, never()).saveUser(any(User.class));
    }
}
