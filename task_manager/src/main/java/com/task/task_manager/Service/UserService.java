package com.task.task_manager.Service;


import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.UserRepo;

@Service
public class UserService {
 
    @Autowired
   private UserRepo repo;
   private BCryptPasswordEncoder encoder=new BCryptPasswordEncoder(12);

   public void saveUser(User user)
   {
         user.setPassword(encoder.encode(user.getPassword()));
                user=repo.save(user);
   }

   public List<User> getData() {
         return repo.findAll();
   }
}
