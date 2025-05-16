package com.task.task_manager.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.task.task_manager.Model.User;
import com.task.task_manager.Repo.UserRepo;
import com.task.task_manager.Model.UserPrincipal;

@Service
public class MyUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepo repo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        
        User user=repo.findByUsername(username).orElseThrow(()->new UsernameNotFoundException("404"));
        
             return new UserPrincipal(user);
    
    }

    
    

}
