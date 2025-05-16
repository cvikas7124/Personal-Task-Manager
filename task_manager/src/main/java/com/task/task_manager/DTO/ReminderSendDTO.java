package com.task.task_manager.DTO;

import java.time.LocalDate;

public record ReminderSendDTO(long id, 
String title, 
LocalDate date,  
String time,
String status) {

}
