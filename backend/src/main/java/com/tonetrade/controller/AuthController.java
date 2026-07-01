package com.tonetrade.controller;

import com.tonetrade.config.JwtUtil;
import com.tonetrade.dto.AuthRequest;
import com.tonetrade.dto.RegisterRequest;
import com.tonetrade.entity.User;
import com.tonetrade.repository.UserRepository;
import com.tonetrade.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "token", token,
            "id", user.getId(),
            "username", user.getUsername(),
            "email", user.getEmail()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody AuthRequest request) {
        // resolve username → email if needed
        String email = request.getLogin().contains("@")
            ? request.getLogin()
            : userRepository.findByUsername(request.getLogin())
                .map(User::getEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(Map.of(
            "token", token,
            "id", user.getId(),
            "username", user.getUsername(),
            "email", user.getEmail()
        ));
    }
}
