package com.task.task_manager.Exception;

public class NoCompletedTasksException extends RuntimeException {
    public NoCompletedTasksException(String message) {
        super(message);
    }

}
