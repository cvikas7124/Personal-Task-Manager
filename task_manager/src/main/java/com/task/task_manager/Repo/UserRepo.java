package com.task.task_manager.Repo;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.task.task_manager.Model.User;



@Repository
public interface UserRepo  extends JpaRepository<User,Long>{

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    @Query(value = "SELECT * FROM user WHERE DATE(last_login) = :targetDate", nativeQuery = true)
    List<User> findUserByLoginDate(@Param("targetDate") LocalDate targetDate);
}
