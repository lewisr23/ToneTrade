package com.tonetrade.service;

import com.tonetrade.dto.RegisterRequest;
import com.tonetrade.dto.SellerProfileResponse;
import com.tonetrade.entity.Listing;
import com.tonetrade.entity.User;
import com.tonetrade.entity.UserEndorsement;
import com.tonetrade.entity.UserFollow;
import com.tonetrade.repository.ConversationRepository;
import com.tonetrade.repository.ListingRepository;
import com.tonetrade.repository.UserEndorsementRepository;
import com.tonetrade.repository.UserFollowRepository;
import com.tonetrade.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    // Number of distinct endorsements a user needs before they're marked
    // verified. Kept low deliberately — this is a prototype demonstrating the
    // mechanism, not a tuned production threshold.
    private static final long VERIFICATION_THRESHOLD = 2;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserEndorsementRepository userEndorsementRepository;
    private final ConversationRepository conversationRepository;
    private final ListingRepository listingRepository;
    private final UserFollowRepository userFollowRepository;

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .location(request.getLocation())
            .build();

        return userRepository.save(user);
    }

    /**
     * Endorse another user as trustworthy. Only allowed between two users who
     * have actually had a conversation (see ConversationRepository.existsBetweenUsers)
     * — never a random stranger clicking a button. One endorsement per pair;
     * at VERIFICATION_THRESHOLD distinct endorsers, the endorsed user flips to
     * verified.
     */
    @Transactional
    public User endorseUser(Long endorserId, Long endorsedUserId) {
        if (endorserId.equals(endorsedUserId)) {
            throw new RuntimeException("You can't endorse yourself");
        }

        User endorsed = userRepository.findById(endorsedUserId)
            .orElseThrow(() -> new RuntimeException("User not found: " + endorsedUserId));
        User endorser = userRepository.findById(endorserId)
            .orElseThrow(() -> new RuntimeException("User not found: " + endorserId));

        if (!conversationRepository.existsBetweenUsers(endorserId, endorsedUserId)) {
            throw new RuntimeException("You can only endorse someone you've actually messaged");
        }
        if (userEndorsementRepository.existsByEndorserIdAndEndorsedId(endorserId, endorsedUserId)) {
            throw new RuntimeException("You've already endorsed this user");
        }

        UserEndorsement endorsement = UserEndorsement.builder()
            .endorser(endorser)
            .endorsed(endorsed)
            .build();
        userEndorsementRepository.save(endorsement);

        long count = userEndorsementRepository.countByEndorsedId(endorsedUserId);
        if (count >= VERIFICATION_THRESHOLD && !endorsed.isVerified()) {
            endorsed.setVerified(true);
            userRepository.save(endorsed);
        }

        return endorsed;
    }

    /**
     * Follow another user — no messaging prerequisite (unlike endorsement),
     * purely a subscribe relationship, doesn't affect the verified badge.
     * Returns the updated follower count.
     */
    @Transactional
    public long followUser(Long followerId, Long followedId) {
        if (followerId.equals(followedId)) {
            throw new RuntimeException("You can't follow yourself");
        }
        if (!userRepository.existsById(followedId)) {
            throw new RuntimeException("User not found: " + followedId);
        }
        if (!userFollowRepository.existsByFollowerIdAndFollowedId(followerId, followedId)) {
            User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("User not found: " + followerId));
            User followed = userRepository.findById(followedId)
                .orElseThrow(() -> new RuntimeException("User not found: " + followedId));
            userFollowRepository.save(UserFollow.builder().follower(follower).followed(followed).build());
        }
        return userFollowRepository.countByFollowedId(followedId);
    }

    /** Unfollow — a no-op (not an error) if not currently following. Returns the updated follower count. */
    @Transactional
    public long unfollowUser(Long followerId, Long followedId) {
        userFollowRepository.deleteByFollowerIdAndFollowedId(followerId, followedId);
        return userFollowRepository.countByFollowedId(followedId);
    }

    /**
     * Public seller profile — username, verified status, location, bio,
     * endorsement count, follower count, and their non-removed listings
     * (active + sold, newest first). No auth required to view (see
     * SecurityConfig); viewerId is null for anonymous visitors, in which case
     * followedByViewer is always false.
     */
    @Transactional(readOnly = true)
    public SellerProfileResponse getSellerProfile(Long sellerId, Long viewerId) {
        User user = userRepository.findById(sellerId)
            .orElseThrow(() -> new RuntimeException("User not found: " + sellerId));

        long endorsementCount = userEndorsementRepository.countByEndorsedId(sellerId);
        long followerCount = userFollowRepository.countByFollowedId(sellerId);
        boolean followedByViewer = viewerId != null
            && userFollowRepository.existsByFollowerIdAndFollowedId(viewerId, sellerId);

        List<Listing> listings = listingRepository.findBySellerId(sellerId).stream()
            .filter(l -> l.getStatus() != Listing.ListingStatus.REMOVED)
            .sorted(Comparator.comparing(Listing::getCreatedAt).reversed())
            .toList();

        return SellerProfileResponse.from(user, endorsementCount, followerCount, followedByViewer, listings);
    }
}
