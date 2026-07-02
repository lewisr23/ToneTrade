package com.tonetrade.service;

import com.tonetrade.dto.RegisterRequest;
import com.tonetrade.entity.User;
import com.tonetrade.entity.UserEndorsement;
import com.tonetrade.repository.ConversationRepository;
import com.tonetrade.repository.UserEndorsementRepository;
import com.tonetrade.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
