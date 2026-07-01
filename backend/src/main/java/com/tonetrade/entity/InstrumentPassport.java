package com.tonetrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Instrument Passport — a full history log attached to a listing.
 * Tracks ownership changes, repairs, servicing, modifications over time.
 * This is a core ToneTrade differentiator vs Reverb/eBay/Facebook Marketplace.
 */
@Entity
@Table(name = "instrument_passports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstrumentPassport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    // Optional: serial number for the instrument
    private String serialNumber;

    // Optional: original purchase year
    private Integer yearManufactured;

    @OneToMany(mappedBy = "passport", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PassportEntry> entries = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
