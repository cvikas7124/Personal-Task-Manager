package com.task.task_manager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.task.task_manager.Controller.HomeController;
import com.task.task_manager.DTO.LoginDTO;
import com.task.task_manager.DTO.UserRegisterDTO;
import com.task.task_manager.Model.MailBody;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.ActivityLogRepo;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.EmailService;
import com.task.task_manager.Service.JwtService;
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

        when(userRepo.findByUsername(dto.username())).thenReturn(Optional.empty());
        when(userRepo.findByEmail(dto.email())).thenReturn(Optional.empty());
        doNothing().when(userService).saveUser(any(User.class));
        doNothing().when(emailService).sendHtmlMessage(any(MailBody.class));

        mockMvc.perform(post("/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Added Successfully"));

        verify(userService).saveUser(any(User.class));
        verify(emailService).sendHtmlMessage(any(MailBody.class));
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
}
