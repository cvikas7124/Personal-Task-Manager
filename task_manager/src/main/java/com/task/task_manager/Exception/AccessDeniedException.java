package com.task.task_manager.Exception;

public class AccessDeniedException extends RuntimeException{

    public AccessDeniedException(String msg)
    {
        super(msg);
    }

}
