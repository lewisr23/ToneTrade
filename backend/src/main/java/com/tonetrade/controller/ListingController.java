package com.tonetrade.controller;

import com.tonetrade.dto.ListingRequest;
import com.tonetrade.dto.ListingResponse;
import com.tonetrade.entity.User;
import com.tonetrade.repository.UserRepository;
import com.tonetrade.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;
    private final UserRepository userRepository;

    // minPrice/maxPrice added 2026-07-28 — usability testing (P1-P4) surfaced
    // that browsing had no way to narrow results by price at all, only
    // category + free-text search. Optional and independent of each other
    // (either, both, or neither can be supplied).
    @GetMapping
    public ResponseEntity<List<ListingResponse>> getListings(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {
        return ResponseEntity.ok(listingService.getListings(search, category, minPrice, maxPrice));
    }

    // Public — but if a valid token is sent, JwtAuthFilter still populates the
    // principal (see UserController.getSellerProfile for the same pattern),
    // which is how savedByViewer gets set for a logged-in viewer.
    @GetMapping("/{id}")
    public ResponseEntity<ListingResponse> getListing(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        Long viewerId = null;
        if (principal != null) {
            viewerId = userRepository.findByEmail(principal.getUsername())
                .map(User::getId)
                .orElse(null);
        }
        return ResponseEntity.ok(listingService.getListingById(id, viewerId));
    }

    @PostMapping
    public ResponseEntity<ListingResponse> createListing(
            @Valid @RequestBody ListingRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User seller = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(listingService.createListing(request, seller.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ListingResponse> updateListing(
            @PathVariable Long id,
            @Valid @RequestBody ListingRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(listingService.updateListing(id, request, user.getId()));
    }

    // Direct purchase at the listed price — no negotiation step. Auth required,
    // falls under the SecurityConfig anyRequest().authenticated() catch-all (a
    // POST, so it's untouched by the GET-specific permitAll rules above it).
    // Added 2026-07-25 alongside the messaging/offer accept-sells-listing path,
    // which was previously the only way to actually sell a listing.
    @PostMapping("/{id}/buy")
    public ResponseEntity<ListingResponse> buyListing(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(listingService.buyListing(id, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        listingService.deleteListing(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    // Auth required for all three of these — note the SecurityConfig rule
    // for GET /api/listings/saved specifically, which must come before the
    // general GET /api/listings/** permitAll rule or this would be public.
    @PostMapping("/{id}/save")
    public ResponseEntity<Void> saveListing(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        listingService.saveListing(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/save")
    public ResponseEntity<Void> unsaveListing(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        listingService.unsaveListing(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/saved")
    public ResponseEntity<List<ListingResponse>> getSavedListings(
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(listingService.getSavedListings(user.getId()));
    }
}
