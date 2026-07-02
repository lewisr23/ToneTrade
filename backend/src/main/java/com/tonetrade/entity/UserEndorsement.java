package com.tonetrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * A user vouching for another user's trustworthiness, based on having
 * actually interacted with them (see UserService.endorseUser — only allowed
 * between two users who share a Conversation). Once a user accumulates
 * enough endorsements, User.verified flips to true.
 */
@Entity
@Table(name = "user_endorsements", uniqueConstraints = @UniqueConstraint(columnNames = {"endorser_id", "endorsed_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEndorsement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endorser_id", nullable = false)
    private User endorser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endorsed_id", nullable = false)
    private User endorsed;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
