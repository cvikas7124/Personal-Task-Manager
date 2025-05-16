package com.task.task_manager.Scheduler;

import com.task.task_manager.Model.MailBody;
import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class LoginReminderScheduler {

    @Autowired
    private  UserRepo userRepo;
    @Autowired
    private  EmailService emailService;

        @Scheduled(cron = "0 0 10 * * ?") // Every day at 10 AM
        public void sendLoginReminders() {
            sendReminderForDaysAgo(2);
            sendReminderForDaysAgo(5);
            sendReminderForDaysAgo(10);
            sendReminderForDaysAgo(30);
        }
        
        private void sendReminderForDaysAgo(int daysAgo) {
            LocalDate targetDate = LocalDate.now().minusDays(daysAgo);
            List<User> users = userRepo.findUserByLoginDate(targetDate);
        
            for (User user : users) {
                String subject = switch (daysAgo) {
                    case 2 -> "Hey, it's been 2 days!";
                    case 5 -> "We haven't seen you in 5 days!";
                    case 10 -> "10 days away? We miss you!";
                    case 30 -> "A month already? Come back!";
                    default -> "We miss you!";
                };
        
                String html = "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;'>" +
                "<div style='max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'>" +
                "<h2 style='color: #333;'>Hello " + user.getUsername() + ",</h2>" +
                "<p style='font-size: 16px; color: #555;'>It's been " + daysAgo + " days since your last login. We noticed your absence and we'd love to have you back!</p>" +
                "<p style='font-size: 16px; color: #555;'>Log in to your task manager and stay on top of your tasks!</p>" +
                "<p style='font-size: 14px; color: #888;'>– TickIT Team</p>" +
                "</div>" +
                "</body>" +
                "</html>";
        
                MailBody mail = new MailBody(user.getEmail(), subject, html);
                emailService.sendHtmlMessage(mail);
            
        }
    }
}
    

