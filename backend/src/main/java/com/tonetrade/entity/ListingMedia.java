package com.tonetrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Audio/video/image media attached to a listing.
 * Audio and video demos are a core ToneTrade differentiator.
 */
@Entity
@Table(name = "listing_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaType mediaType;

    // URL to stored file (e.g. Railway volume, S3, Cloudinary)
    @Column(nullable = false)
    private String url;

    // Optional label e.g. "Clean tone demo", "Full band mix"
    private String label;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();

    public enum MediaType {
        IMAGE, AUDIO, VIDEO
    }
}
