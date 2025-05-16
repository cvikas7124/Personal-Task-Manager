package com.task.task_manager.Model;

import jakarta.mail.internet.InternetAddress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class MailBody  {

    private String to;
    private String subject;
    private String text;
    public InternetAddress to() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'to'");
    }
}
