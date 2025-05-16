package com.task.task_manager.AOP;

import com.task.task_manager.Annotation.LogActivity;
import com.task.task_manager.Model.ActivityLog;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.ActivityLogRepo;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.JwtService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;

@Aspect
@Component
public class ActivityLogAspect {

    @Autowired
    private  ActivityLogRepo activityLogRepo;
    @Autowired
    private  JwtService jwtService;
    @Autowired
    private  UserRepo userRepo; // Add the user repository to fetch user details

    // Pointcut for methods annotated with @LogActivity
    @Pointcut("@annotation(logActivity)")
    public void loggableMethod(LogActivity logActivity) {}

    // Intercept the method and log the activity
    @AfterReturning(value = "loggableMethod(logActivity)", argNames = "joinPoint,logActivity")
    public void logAfter(JoinPoint joinPoint, LogActivity logActivity) {
        ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attr == null) return;

        HttpServletRequest request = attr.getRequest();
        String token = jwtService.extractToken(request); // Assuming method to extract token

        if (token == null) return;

        // Extract username from JWT token
        String username = jwtService.extractUserName(token); // Username extracted from the JWT token
        if (username == null) return;

        // Retrieve user from database using the username
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) return;

        // Log action only if the request is an API call that modifies data (POST, PUT, DELETE)
        String action = logActivity.value();
        if (action == null || action.isEmpty()) return;

         // Update last activity time
           user.setLastActivity(LocalDateTime.now());
           userRepo.save(user); // Save the user with updated lastActivity
           
        // Create and save the activity log
        ActivityLog log = ActivityLog.builder()
            .user(user) // Use the User object retrieved from the database
            .action(action)
            .timestamp(LocalDateTime.now())
            .build();

        // Save the activity log to the repository
        activityLogRepo.save(log);
    }
}
