package com.task.task_manager.Controller;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.task.task_manager.Annotation.LogActivity;
import com.task.task_manager.DTO.LoginDTO;
import com.task.task_manager.DTO.UserRegisterDTO;
import com.task.task_manager.Exception.UserNotFoundException;
import com.task.task_manager.Model.ActivityLog;
import com.task.task_manager.Model.MailBody;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.ActivityLogRepo;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.EmailService;
import com.task.task_manager.Service.JwtService;
import com.task.task_manager.Service.RedisService;
import com.task.task_manager.Service.UserService;

import jakarta.validation.Valid;


@RestController
public class HomeController {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    AuthenticationManager authenticationManager;
    @Autowired
    private JwtService jwtService; 
    @Autowired
    private UserService userService;

    @Autowired
    private RedisService redisService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ActivityLogRepo activityLogRepo;

    @PostMapping("/register")
public ResponseEntity<?> register(@Valid @RequestBody UserRegisterDTO dto) throws JsonProcessingException {
    // 1. Validate email domain
    String emailDomain = dto.email().substring(dto.email().lastIndexOf("@") + 1);
    if (!emailDomain.equalsIgnoreCase("gmail.com") && !emailDomain.equalsIgnoreCase("jadeglobal.com")) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Please provide a valid Gmail address");
    }

    // 2. Check for existing username/email
    if (userRepo.findByUsername(dto.username()).isPresent()) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists");
    }

    if (userRepo.findByEmail(dto.email()).isPresent()) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
    }

    // 3. Check if OTP already sent
    String existingOtp = redisService.getOtp(dto.email());
    if (existingOtp != null) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body("An OTP was already sent to this email. Please verify it or wait before retrying.");
    }

    // 4. Generate and save OTP
    String otp = String.valueOf(new Random().nextInt(900000) + 100000);
    ObjectMapper mapper = new ObjectMapper();
    String userJson = mapper.writeValueAsString(dto);

    redisService.saveUserOtp(dto.email(), userJson, otp, 2); // valid for 10 minutes

    // 5. Send OTP email (HTML)
    MailBody mailBody = MailBody.builder()
        .to(dto.email())
        .subject("Verify your Email - TickIT")
        .text("<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<style>" +
                "  body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }" +
                "  .container { background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }" +
                "  h2 { color: #4CAF50; }" +
                "  p { font-size: 16px; color: #333; }" +
                "  .otp { font-size: 24px; font-weight: bold; color: #4CAF50; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "  <div class='container'>" +
                "    <h2>Email Verification</h2>" +
                "    <p>Hi " + dto.username() + ",</p>" +
                "    <p>Thank you for registering with TickIT!</p>" +
                "    <p>Please use the OTP below to verify your email address:</p>" +
                "    <p class='otp'>" + otp + "</p>" +
                "    <p>This OTP is valid for 10 minutes.</p>" +
                "    <p>If you didn't request this, you can ignore this email.</p>" +
                "    <p>Cheers,<br>TickIT Team</p>" +
                "  </div>" +
                "</body>" +
                "</html>")
        .build();

    emailService.sendHtmlMessage(mailBody);

    return ResponseEntity.ok("OTP sent to your email. Please verify.");
}


@PostMapping("/verify-otp")
public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) throws JsonProcessingException {
    String email = payload.get("email");
    String inputOtp = payload.get("otp");

    if (email == null || inputOtp == null) {
        return ResponseEntity.badRequest().body("Email and OTP are required.");
    }

    // 1. Fetch OTP from Redis
    String savedOtp = redisService.getOtp(email);
    if (savedOtp == null) {
        return ResponseEntity.status(HttpStatus.GONE).body("OTP expired or not requested.");
    }

    if (!savedOtp.equals(inputOtp)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid OTP.");
    }

    // 2. Fetch temp user from Redis
    String userJson = redisService.getTempUser(email);
    if (userJson == null) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Temporary user data not found.");
    }

    // 3. Convert JSON back to DTO
    ObjectMapper mapper = new ObjectMapper();
    UserRegisterDTO dto = mapper.readValue(userJson, UserRegisterDTO.class);

    // 4. Save user to DB
    if (userRepo.findByUsername(dto.username()).isPresent()) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already taken.");
    }
    if (userRepo.findByEmail(dto.email()).isPresent()) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already registered.");
    }

    User user = new User();
    user.setUsername(dto.username());
    user.setEmail(dto.email());
    user.setPassword(dto.password()); // assuming already encrypted
    userService.saveUser(user);
    MailBody mailBody = MailBody.builder()
    .to(dto.email())
    .text("<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<style>" +
            "  body { font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; }" +
            "  .container { background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }" +
            "  h2 { color: #4CAF50; }" +
            "  p { font-size: 16px; color: #333333; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "  <div class='container'>" +
            "    <h2>Welcome to TickIT!</h2>" +
            "    <p>Hi "+ dto.username()+",</p>" +
            "    <p>Your registration was successful. We're excited to have you on board!</p>" +
            "    <p>Start managing your tasks more efficiently today.</p>" +
            "    <p>Cheers,<br>TickIT Team</p>" +
            "  </div>" +
            "</body>" +
            "</html>"
    )
    .subject("Registration Successful")
    .build();
emailService.sendHtmlMessage(mailBody);
    
    // 5. Log the registration
    ActivityLog log = ActivityLog.builder()
        .user(user)
        .action("User verified email and registered: " + dto.username())
        .timestamp(LocalDateTime.now())
        .build();
    activityLogRepo.save(log);

    // 6. Clean Redis
    redisService.deleteOtp(email);
    redisService.deleteTempUser(email);

    return ResponseEntity.ok("Email verified and user registered successfully.");
}


    @LogActivity("Logged In")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO loginDTO) {
        User user= userRepo.findByUsername(loginDTO.username())
                .orElse(null);
        try{
         authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginDTO.username(),
          loginDTO.password()));
        
            if (user == null) {
                throw new UserNotFoundException("User not found with username: " + loginDTO.username());
            }
            // Update last login time
        
          user.setLastLogin(java.time.LocalDateTime.now());
            userRepo.save(user);

             ActivityLog log = ActivityLog.builder()
            .user(user)
            .action("Logged In: "+ loginDTO.username())
            .timestamp(LocalDateTime.now())
            .build();
            activityLogRepo.save(log);

            // Generate new tokens
            String newAccessToken=jwtService.generateAccessToken(loginDTO.username());
            String newRefreshToken=jwtService.generateRefreshToken(loginDTO.username());
            Map<String, String> tokenMap = new HashMap<>();
            tokenMap.put("accessToken", newAccessToken);
            tokenMap.put("username",loginDTO.username());
            tokenMap.put("email", user.getEmail());
            
            ResponseCookie cookie=ResponseCookie.from("refreshToken",newRefreshToken)
            .httpOnly(true)
            .secure(false)
            .path("/refresh")
            .maxAge(Duration.ofDays(1))
            .sameSite("Lax")
            .build();

              return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,cookie.toString()).body(tokenMap);
        }
        catch(BadCredentialsException e)
        {
            // Log the failed login attempt
            ActivityLog log = ActivityLog.builder()
            .user(user) // No user associated with failed login
            .action("Failed Login Attempt: "+ loginDTO.username())
            .timestamp(LocalDateTime.now())
            .build();
            activityLogRepo.save(log);
            // Return error response
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Invaild username password");
        }
    }

    
    @LogActivity("Token Refreshed")
   @PostMapping("/refresh")
public ResponseEntity<?> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
    if (refreshToken == null || refreshToken.isEmpty()) {
        return ResponseEntity.badRequest().body("you have logged out . Pls login");
    }

    try {
        String username = jwtService.extractUserName(refreshToken);

        if (jwtService.isTokenValid(refreshToken, username)) {
            String newAccessToken = jwtService.generateAccessToken(username);
            String newRefreshToken = jwtService.generateRefreshToken(username); // optional rotation

            Map<String, String> tokenMap = new HashMap<>();
            tokenMap.put("accessToken", newAccessToken);

            // Optionally rotate refresh token and set new cookie
            ResponseCookie cookie = ResponseCookie.from("refreshToken", newRefreshToken)
                    .httpOnly(true)
                    .secure(false) // set false for localhost without HTTPS
                    .path("/refresh")
                    .maxAge(Duration.ofDays(1))
                    .sameSite("Lax")
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(tokenMap);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired refresh token.Please log in again.");
        }
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token. Please log in again.");
    }
}
@LogActivity("Logged Out")
@PostMapping("/log")
public ResponseEntity<?> logout() {
    ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
            .httpOnly(true)
            .secure(false)
            .path("/refresh") 
            .maxAge(0)
            .sameSite("Lax")
            .build();

    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
            .body("Logged out successfully");
}

}
