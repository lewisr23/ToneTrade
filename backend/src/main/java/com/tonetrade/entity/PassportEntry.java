package com.tonetrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A single entry in an instrument's passport history.
 * e.g. "2019 - Original purchase from Guitar Guitar, Edinburgh"
 *      "2022 - Fret level and setup by Luthier Guitars, Newcastle"
 *      "2024 - Pickup swap: Seymour Duncan SSL-1 installed"
 */
@Entity
@Table(name = "passport_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PassportEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passport_id", nullable = false)
    private InstrumentPassport passport;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntryType entryType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    // Approximate date of the event (not necessarily when entry was logged)
    private LocalDate eventDate;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum EntryType {
        ORIGINAL_PURCHASE,
        OWNERSHIP_CHANGE,
        SERVICE,
        REPAIR,
        MODIFICATION,
        OTHER
    }
}
