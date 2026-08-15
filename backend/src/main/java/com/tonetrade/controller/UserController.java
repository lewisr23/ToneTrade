package com.tonetrade.controller;

import com.tonetrade.dto.SellerProfileResponse;
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

    @PostMapping("/{id}/follow")
    public ResponseEntity<Map<String, Object>> follow(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User follower = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        long followerCount = userService.followUser(follower.getId(), id);
        return ResponseEntity.ok(Map.of(
            "followedUserId", id,
            "followerCount", followerCount,
            "following", true
        ));
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<Map<String, Object>> unfollow(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User follower = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        long followerCount = userService.unfollowUser(follower.getId(), id);
        return ResponseEntity.ok(Map.of(
            "followedUserId", id,
            "followerCount", followerCount,
            "following", false
        ));
    }

    // Public seller profile page — no auth required (see SecurityConfig), but
    // if the request does carry a valid token, JwtAuthFilter still populates
    // the SecurityContext, so principal may be non-null even on this permitAll
    // route — that's how followedByViewer gets set for a logged-in viewer.
    @GetMapping("/{id}/profile")
    public ResponseEntity<SellerProfileResponse> getSellerProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        Long viewerId = null;
        if (principal != null) {
            viewerId = userRepository.findByEmail(principal.getUsername())
                .map(User::getId)
                .orElse(null);
        }
        return ResponseEntity.ok(userService.getSellerProfile(id, viewerId));
    }
}
