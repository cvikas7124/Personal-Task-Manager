package com.task.task_manager.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.ForgetPasswordRepo;

import jakarta.transaction.Transactional;

@Service
public class ForgetPasswordService {

 @Autowired
    private ForgetPasswordRepo forgetPasswordRepo;
    @Transactional
    public void deleteByUser(User user) {
        forgetPasswordRepo.deleteByUser(user);
    }
}
