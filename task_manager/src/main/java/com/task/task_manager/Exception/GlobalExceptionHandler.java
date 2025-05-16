package com.task.task_manager.Exception;

import java.time.DateTimeException;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingPathVariableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.persistence.EntityNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getAllErrors().forEach((error) -> {
        String fieldName = ((FieldError) error).getField();
        String errorMessage = error.getDefaultMessage();
        errors.put(fieldName, errorMessage);
    });
    return ResponseEntity.badRequest().body(errors);
}

@ExceptionHandler(HttpMessageNotReadableException.class)
public ResponseEntity<?> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
    Throwable cause = ex;

    // Traverse the exception cause chain
    while (cause != null) {
        if (cause instanceof DateTimeParseException dateEx) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Invalid date format: " + dateEx.getParsedString())
            );
        }
        cause = cause.getCause();
    }

    // Fallback response
    return ResponseEntity.badRequest().body(
        Map.of("error", "Malformed JSON request: " + ex.getMostSpecificCause().getMessage())
    );
}

     @ExceptionHandler(InvalidTaskException.class)
    public ResponseEntity<?> handleInvalidTask(InvalidTaskException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
     @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<String> handleNoResourceFoundException(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Resource not found or invalid path");
    }
    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<?> handleInvalidDate(DateTimeParseException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
    @ExceptionHandler(RemindersNotFoundException.class)
    public ResponseEntity<?> handleRemindersNotFound(RemindersNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<?> handleUserNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(DateTimeException.class)
    public ResponseEntity<?> handleDateTimeException(DateTimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }
    @ExceptionHandler(NoUpcomingTasksException.class)
    public ResponseEntity<?> handleNoUpcomingTasks(NoUpcomingTasksException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }   
    @ExceptionHandler(NoCompletedTasksException.class)
    public ResponseEntity<?> handleNoCompletedTasks(NoCompletedTasksException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }   
    @ExceptionHandler(HabitNotFoundException.class)
    public ResponseEntity<?> handleHabitTrackerNotFound(HabitNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }   

    @ExceptionHandler(NoOldIncompleteTasksException.class)
    public ResponseEntity<?> handleNoIncompletedTasks(NoOldIncompleteTasksException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(EmptyResultDataAccessException.class)
    public ResponseEntity<String> handleNotFound(Exception ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Resource not found");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrity(Exception ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Delete failed due to related data");
    }
    @ExceptionHandler(EntityNotFoundException.class)
public ResponseEntity<String> handleIllegalArgument(EntityNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
}

@ExceptionHandler(MissingPathVariableException.class)
public ResponseEntity<String> handleMissingPathVariable(MissingPathVariableException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Task ID is required to delete a task.");
}


    // catch-all
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleOtherExceptions(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong OR hitting wrong URL");
    }
}
