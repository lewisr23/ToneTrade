package com.tonetrade.controller;

import com.tonetrade.dto.ListingMediaResponse;
import com.tonetrade.entity.ListingMedia;
import com.tonetrade.entity.User;
import com.tonetrade.repository.UserRepository;
import com.tonetrade.service.ListingMediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/listings/{listingId}/media")
@RequiredArgsConstructor
public class MediaController {

    private final ListingMediaService listingMediaService;
    private final UserRepository userRepository;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ListingMediaResponse> uploadMedia(
            @PathVariable Long listingId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("mediaType") String mediaType,
            @RequestParam(value = "label", required = false) String label,
            @AuthenticationPrincipal UserDetails principal) {
        User seller = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        ListingMedia media = listingMediaService.uploadMedia(listingId, seller.getId(), file, mediaType, label);
        return ResponseEntity.status(HttpStatus.CREATED).body(ListingMediaResponse.from(media));
    }

    @GetMapping
    public ResponseEntity<List<ListingMediaResponse>> getMedia(@PathVariable Long listingId) {
        List<ListingMediaResponse> media = listingMediaService.getMediaForListing(listingId).stream()
            .map(ListingMediaResponse::from)
            .toList();
        return ResponseEntity.ok(media);
    }

    // Added alongside edit-listing media management -- lets a seller remove
    // a single photo/audio/video item without having to delete and recreate
    // the whole listing. Auth required, falls under the SecurityConfig
    // anyRequest().authenticated() catch-all (only GET is permitAll'd for
    // /api/listings/**).
    @DeleteMapping("/{mediaId}")
    public ResponseEntity<Void> deleteMedia(
            @PathVariable Long listingId,
            @PathVariable Long mediaId,
            @AuthenticationPrincipal UserDetails principal) {
        User seller = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        listingMediaService.deleteMedia(listingId, mediaId, seller.getId());
        return ResponseEntity.noContent().build();
    }
}
