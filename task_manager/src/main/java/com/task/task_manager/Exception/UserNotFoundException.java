package com.task.task_manager.Exception;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String msg)
    {
        super(msg);
    }
}
