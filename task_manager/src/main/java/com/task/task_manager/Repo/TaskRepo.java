package com.task.task_manager.Repo;


import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.task.task_manager.Model.Task;

public interface TaskRepo extends JpaRepository<Task,Long> {

    @Query("SELECT t FROM Task t WHERE t.dueDate >= :yesterday AND t.user.username = :username AND t.status IN ('ONGOING', 'INCOMPLETE')")
    List<Task> findRecentAndUpcomingTasks(@Param("yesterday") LocalDate yesterday, @Param("username") String username);
    
    @Query("SELECT t FROM Task t WHERE t.dueDate >= :sevenDaysAgo AND t.user.username = :username AND t.status = 'COMPLETED'")
List<Task> findCompletedTasksFromLastSevenDays(@Param("sevenDaysAgo") LocalDate sevenDaysAgo, @Param("username") String username);

@Query("SELECT t FROM Task t WHERE t.dueDate >= :startDate AND t.dueDate < :endDate AND t.user.username = :username AND t.status IN ('INCOMPLETE', 'ONGOING')")
List<Task> findOldOngoingAndIncompleteTasks(
    @Param("startDate") LocalDate startDate, 
    @Param("endDate") LocalDate endDate, 
    @Param("username") String username
);
    
@Query("SELECT COUNT(t) FROM Task t WHERE t.user.username = :username AND t.status = 'INCOMPLETE' AND t.dueDate >= :today")
Long countPendingTasks(@Param("username") String username, @Param("today") LocalDate today);

@Query("SELECT COUNT(t) FROM Task t WHERE t.user.username = :username AND t.status = 'ONGOING' AND t.dueDate >= :today")
Long countOngoingTasks(@Param("username") String username, @Param("today") LocalDate today);

@Query("SELECT COUNT(t) FROM Task t WHERE t.user.username = :username AND t.status = 'INCOMPLETE' AND t.dueDate = CURRENT_DATE")
Long countTodayPendingTasks(@Param("username") String username);

@Query("SELECT COUNT(t) FROM Task t WHERE t.user.username = :username AND t.status = 'ONGOING' AND t.dueDate = CURRENT_DATE")
Long countTodayOngoingTasks(@Param("username") String username);


    

} 
