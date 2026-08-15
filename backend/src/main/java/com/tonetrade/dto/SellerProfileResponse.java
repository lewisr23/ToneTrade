package com.tonetrade.dto;

import com.tonetrade.entity.Listing;
import com.tonetrade.entity.User;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

// Public seller profile page — deliberately excludes email/passwordHash (this
// is shown to any visitor, logged in or not; see SecurityConfig permitAll
// on GET /api/users/*/profile).
@Data
public class SellerProfileResponse {

    private Long id;
    private String username;
    private boolean verified;
    private String location;
    private String bio;
    private LocalDateTime memberSince;
    private long endorsementCount;
    private long followerCount;
    // Whether the current viewer (if logged in) already follows this seller —
    // false for anonymous viewers, never a hard error, since the profile is
    // public. Drives the Follow/Following button state client-side.
    private boolean followedByViewer;
    private List<ListingResponse> listings;

    public static SellerProfileResponse from(
            User user,
            long endorsementCount,
            long followerCount,
            boolean followedByViewer,
            List<Listing> listings
    ) {
        SellerProfileResponse r = new SellerProfileResponse();
        r.setId(user.getId());
        r.setUsername(user.getUsername());
        r.setVerified(user.isVerified());
        r.setLocation(user.getLocation());
        r.setBio(user.getBio());
        r.setMemberSince(user.getCreatedAt());
        r.setEndorsementCount(endorsementCount);
        r.setFollowerCount(followerCount);
        r.setFollowedByViewer(followedByViewer);
        r.setListings(listings.stream().map(ListingResponse::from).toList());
        return r;
    }
}
