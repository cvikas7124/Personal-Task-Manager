package com.task.task_manager.Annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogActivity {
    String value(); // e.g., "LOGIN", "CREATE_TASK"
}
