package com.task.task_manager.Exception;

public class InvalidTaskException extends RuntimeException{

    public InvalidTaskException(String msg)
    {
        super(msg);
    }

}
