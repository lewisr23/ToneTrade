package com.tonetrade.controller;

import com.tonetrade.entity.User;
import com.tonetrade.repository.UserRepository;
import com.tonetrade.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/{id}/endorse")
    public ResponseEntity<Map<String, Object>> endorse(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User endorser = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        User endorsed = userService.endorseUser(endorser.getId(), id);
        return ResponseEntity.ok(Map.of(
            "userId", endorsed.getId(),
            "verified", endorsed.isVerified()
        ));
    }
}
