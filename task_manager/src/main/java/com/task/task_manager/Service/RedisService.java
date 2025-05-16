package com.task.task_manager.Service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    public String getUserJson(String email) {
        return redisTemplate.opsForValue().get("USER:" + email);
    }

    public void deleteKeys(String email) {
        redisTemplate.delete("OTP:" + email);
        redisTemplate.delete("USER:" + email);
    }
    public void saveUserOtp(String email, String userJson, String otp, int minutes) {
        redisTemplate.opsForValue().set("otp:" + email, otp, Duration.ofMinutes(minutes));
        redisTemplate.opsForValue().set("user:" + email, userJson, Duration.ofMinutes(minutes));
    }
    
    public String getOtp(String email) {
        return redisTemplate.opsForValue().get("otp:" + email);
    }
    
    public String getTempUser(String email) {
        return redisTemplate.opsForValue().get("user:" + email);
    }
    
    public void deleteOtp(String email) {
        redisTemplate.delete("otp:" + email);
    }
    
    public void deleteTempUser(String email) {
        redisTemplate.delete("user:" + email);
    }
    
}
