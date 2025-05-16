package com.task.task_manager.Exception;

public class NoUpcomingTasksException extends RuntimeException{

    public NoUpcomingTasksException(String msg)
    {
        super(msg);
    }

}
