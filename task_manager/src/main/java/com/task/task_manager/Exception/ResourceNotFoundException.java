package com.task.task_manager.Exception;

public class ResourceNotFoundException extends RuntimeException{

  public ResourceNotFoundException(String msg)
  {
    super(msg);
  }

}
