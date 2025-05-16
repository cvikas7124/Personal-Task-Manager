package com.task.task_manager.Exception;

public class NoOldIncompleteTasksException extends RuntimeException {
    public NoOldIncompleteTasksException(String message) {
        super(message);
    }

}
