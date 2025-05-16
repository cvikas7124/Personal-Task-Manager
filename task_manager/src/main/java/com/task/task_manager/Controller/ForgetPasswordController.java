package com.task.task_manager.Controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.task.task_manager.DTO.EmailRequest;
import com.task.task_manager.DTO.OtpRequest;
import com.task.task_manager.DTO.PasswordRequest;
import com.task.task_manager.Exception.UserNotFoundException;
import com.task.task_manager.Model.ActivityLog;
import com.task.task_manager.Model.ForgetPassword;
import com.task.task_manager.Model.MailBody;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.ActivityLogRepo;
import com.task.task_manager.Repo.ForgetPasswordRepo;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.EmailService;
import com.task.task_manager.Service.ForgetPasswordService;
import com.task.task_manager.Service.UserService;

import jakarta.validation.Valid;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;





@RestController
@RequestMapping("/forgetPassword")
public class ForgetPasswordController {

    @Autowired
    private UserRepo userRepo;
    @Autowired
    private EmailService emailService;

    private User user;

    @Autowired
    private UserService userService;
 
    @Autowired
    private ForgetPasswordRepo forgetPasswordRepo;

    @Autowired
    private ForgetPasswordService forgetPasswordService;

    @Autowired
    private ActivityLogRepo activityLogRepo;

    
    @PostMapping("/verifyMail")
    public ResponseEntity<?> verifyMail(@Valid @RequestBody EmailRequest emailRequest) {
        String emailDomain = emailRequest.email().substring(emailRequest.email().lastIndexOf("@") + 1);
        if (!emailDomain.equals("gmail.com") && !emailDomain.equals("jadeglobal.com")) {
       return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Please provide a valid Gmail address");
        }
        User user = userRepo.findByEmail(emailRequest.email())
            .orElseThrow(() -> new UserNotFoundException("Please provide a valid email"));
    

        forgetPasswordService.deleteByUser(user);
        int otp = otpGenerator();
    
        MailBody mailBody = MailBody.builder()
            .to(emailRequest.email())
            .text("<html>" +
                "<body style='font-family: Arial; background-color: #f9f9f9; padding: 30px;'>" +
                "<div style='max-width: 400px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>" +
                "<h2 style='color: #333;'>Hi "+ user.getUsername()+"!</h2>" +
                "<p style='font-size: 16px; color: #555;'>Your OTP code is:</p>" +
                "<p style='font-size: 24px; font-weight: bold; color: #2c3e50;'>" + otp + "</p>" +
                "<p style='font-size: 14px; color: #888;'>Please use this code to reset your password. It will expire soon.</p>" +
                "<p style='font-size: 14px; color: #aaa;'>– TickIT Team</p>" +
                "</div>" +
                "</body>" +
                "</html>"
            )
            .subject("OTP for Forget Password Request")
            .build();
        emailService.sendHtmlMessage(mailBody);
    
        
       ForgetPassword fp=new ForgetPassword();
       fp.setOtp(otp);
       fp.setExpirationTime(new Date(System.currentTimeMillis()+ 1000*60*2));
       fp.setOtpVerified(false);
       fp.setUser(user);
       forgetPasswordRepo.save(fp);
    
        ActivityLog log = ActivityLog.builder()
            .user(user)
            .action("Sent OTP for forget password")
            .timestamp(LocalDateTime.now())
            .build();
        activityLogRepo.save(log);
        return ResponseEntity.ok("Email sent for verification");
    }
    
    
    @PostMapping("/verifyOtp")
    public ResponseEntity<String> verifyOtp(@Valid @RequestBody OtpRequest otpRequest ) {
        String emailDomain = otpRequest.email().substring(otpRequest.email().lastIndexOf("@") + 1);
        if (!emailDomain.equals("gmail.com") && !emailDomain.equals("jadeglobal.com")) {
       return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Please provide a valid Gmail address");
        }
        
        User user=userRepo.findByEmail(otpRequest.email())
        .orElseThrow(()->new UserNotFoundException("Please provide a valid email"));
        
        ForgetPassword fp=forgetPasswordRepo.findByOtpAndUser(otpRequest.otp(), user)
        .orElseThrow(()->new BadCredentialsException("Invalid otp for email:"+otpRequest.email()));

        if(fp.getExpirationTime().before(Date.from(Instant.now())))
        {
            forgetPasswordService.deleteByUser(user);
            return new ResponseEntity<>("OTP has expired",HttpStatus.EXPECTATION_FAILED);
        }

       
        fp.setOtpVerified(true);
        forgetPasswordRepo.save(fp);
        ActivityLog log = ActivityLog.builder()
            .user(user)
            .action("Verified OTP for forget password")
            .timestamp(LocalDateTime.now())
            .build();
        activityLogRepo.save(log);
        return ResponseEntity.ok("OTP verified");
    }
    

    @PostMapping("/changePassword")
    public ResponseEntity<String> changePassword(@Valid @RequestBody PasswordRequest passwordRequest) {
         
        String emailDomain = passwordRequest.email().substring(passwordRequest.email().lastIndexOf("@") + 1);
         if (!emailDomain.equals("gmail.com") && !emailDomain.equals("jadeglobal.com")) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Please provide a valid Gmail address");
         }
        user=userRepo.findByEmail(passwordRequest.email()).orElseThrow(()->new UserNotFoundException("Please provide a valid email"));
        ForgetPassword fp=forgetPasswordRepo.findByUser(user)
        .orElseThrow(()->new BadCredentialsException("OTP verification required before changing password"));
        if (!fp.isOtpVerified()) {
            return new ResponseEntity<>("OTP verification required before changing password", HttpStatus.FORBIDDEN);
        }
        if(passwordRequest.newPassword().equals(passwordRequest.confirmPassword()))
        {
          user.setPassword(passwordRequest.confirmPassword());
          userService.saveUser(user);
        }
        else
        {
            return new ResponseEntity<>("Both the password should be same",HttpStatus.EXPECTATION_FAILED);
        }
        forgetPasswordService.deleteByUser(user);
        ActivityLog log = ActivityLog.builder()
            .user(user)
            .action("password changed after OTP verification")
            .timestamp(LocalDateTime.now())
            .build();
        activityLogRepo.save(log);
        return ResponseEntity.ok("Password Updated");
    }
    

    private int otpGenerator()
    {
        Random random=new Random();
        return random.nextInt(100_000,999_999);
    }
    
}
