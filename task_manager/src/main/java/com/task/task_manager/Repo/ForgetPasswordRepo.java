package com.task.task_manager.Repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.task.task_manager.Model.ForgetPassword;
import com.task.task_manager.Model.User;

@Repository
public interface ForgetPasswordRepo  extends JpaRepository<ForgetPassword,Integer>{

    @Query("select fp from ForgetPassword fp where fp.otp=?1 and fp.user=?2")
    Optional<ForgetPassword> findByOtpAndUser(int otp,User user);

    Optional<ForgetPassword> findByUser(User user);

    void deleteByUser(User user);

}
