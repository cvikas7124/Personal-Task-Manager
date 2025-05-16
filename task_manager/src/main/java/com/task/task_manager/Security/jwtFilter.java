package com.task.task_manager.Security;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.task.task_manager.Service.JwtService;
import com.task.task_manager.Service.MyUserDetailsService;

import io.jsonwebtoken.io.IOException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class jwtFilter extends OncePerRequestFilter{

    @Autowired
    JwtService jwtService;

    @Autowired
    ApplicationContext context;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException, java.io.IOException {
                String authHeader = request.getHeader("Authorization");
                String token=null;
                String userName=null;

                if(authHeader !=null && authHeader.startsWith("Bearer"))
                {
                    token=authHeader.substring(7);    
                    try {
                        userName = jwtService.extractUserName(token);
                    } catch (Exception e) {
                        // Token format is invalid or expired
                        sendErrorResponse(response, "Invalid or expired access token. Please refresh.");
                        return;
                    }
                }

                if(userName != null && SecurityContextHolder.getContext().getAuthentication()==null)
                {
                    UserDetails userDetails=context.getBean(MyUserDetailsService.class).loadUserByUsername(userName);
                    if(jwtService.ValidateToken(token, userDetails))
                    {
                        UsernamePasswordAuthenticationToken authToken=new UsernamePasswordAuthenticationToken(userDetails,null,userDetails.getAuthorities());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                    else
                    {
                        sendErrorResponse(response, "Access token expired. Please refresh.");
                        return;
                    }
                }
                filterChain.doFilter(request, response);
            }
    
            private void sendErrorResponse(HttpServletResponse response, String message) throws java.io.IOException {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"" + message + "\"}");
            }
}
