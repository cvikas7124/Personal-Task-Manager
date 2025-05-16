package com.task.task_manager.Service;


import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.task.task_manager.Model.MailBody;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
     
    
    private JavaMailSender javaMailSender;

    public EmailService(JavaMailSender javaMailSender)
    {
        this.javaMailSender=javaMailSender;
    }

    public void sendHtmlMessage(MailBody mailBody) {
    try {
        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);  // true for multipart
        helper.setTo(mailBody.to());
        helper.setFrom("tickit232@gmail.com");
        helper.setSubject(mailBody.getSubject());

        // Use the pre-formatted HTML content
        helper.setText(mailBody.getText(), true);  // true indicates that it's HTML content

        // Send the email
        System.out.println("Sending email to: " + mailBody.to());
        javaMailSender.send(message);
        System.out.println("Email sent successfully!");
    } catch (Exception e) {
        System.out.println("Error while sending email: " + e.getMessage());
        throw new RuntimeException("Failed to send email", e);
    }
}


    // public void sendSimpleMessage(MailBody mailBody)
    // {
    //         SimpleMailMessage message=new SimpleMailMessage();
    //         message.setTo(mailBody.to());
    //         message.setFrom("tickit232@gmail.com");
    //         message.setSubject(mailBody.subject());
    //         message.setText(mailBody.text());
    //         System.out.println("Sending email to: " + mailBody.to());
    //         javaMailSender.send(message);
    //         System.out.println("Email sent successfully!");
            
    // }
}
