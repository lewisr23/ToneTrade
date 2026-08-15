package com.tonetrade.controller;

import com.tonetrade.dto.PassportEntryRequest;
import com.tonetrade.dto.PassportResponse;
import com.tonetrade.entity.User;
import com.tonetrade.repository.UserRepository;
import com.tonetrade.service.PassportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/listings/{listingId}/passport")
@RequiredArgsConstructor
public class PassportController {

    private final PassportService passportService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<PassportResponse> getPassport(@PathVariable Long listingId) {
        return ResponseEntity.ok(passportService.getOrCreatePassport(listingId));
    }

    @PostMapping("/entries")
    public ResponseEntity<PassportResponse> addEntry(
            @PathVariable Long listingId,
            @Valid @RequestBody PassportEntryRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(passportService.addEntry(listingId, request, user.getId()));
    }

    @PutMapping("/entries/{entryId}")
    public ResponseEntity<PassportResponse> updateEntry(
            @PathVariable Long listingId,
            @PathVariable Long entryId,
            @Valid @RequestBody PassportEntryRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(passportService.updateEntry(listingId, entryId, request, user.getId()));
    }
}
