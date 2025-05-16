package com.task.task_manager.Model;

import lombok.Builder;


@Builder
public record MailBody(String to,String subject,String text)  {

}
