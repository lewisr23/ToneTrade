package com.tonetrade.service;

import com.tonetrade.dto.PassportEntryRequest;
import com.tonetrade.dto.PassportResponse;
import com.tonetrade.entity.InstrumentPassport;
import com.tonetrade.entity.Listing;
import com.tonetrade.entity.PassportEntry;
import com.tonetrade.repository.InstrumentPassportRepository;
import com.tonetrade.repository.ListingRepository;
import com.tonetrade.repository.PassportEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class PassportService {

    private final InstrumentPassportRepository passportRepository;
    private final ListingRepository listingRepository;
    private final PassportEntryRepository passportEntryRepository;

    @Transactional
    public PassportResponse getOrCreatePassport(Long listingId) {
        return PassportResponse.from(
            passportRepository.findByListingId(listingId)
                .orElseGet(() -> createPassportForListing(listingId))
        );
    }

    @Transactional
    public PassportResponse addEntry(Long listingId, PassportEntryRequest request, Long requestingUserId) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        if (!listing.getSeller().getId().equals(requestingUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the seller can add passport entries");
        }

        InstrumentPassport passport = passportRepository.findByListingId(listingId)
            .orElseGet(() -> createPassportForListing(listingId));

        PassportEntry entry = PassportEntry.builder()
            .passport(passport)
            .entryType(request.getEntryType())
            .description(request.getDescription())
            .eventDate(request.getEventDate())
            .build();

        passport.getEntries().add(entry);
        return PassportResponse.from(passportRepository.save(passport));
    }

    /**
     * Corrects an existing Gear History entry (entry type, description,
     * event date). Added late in development after a real typo made it into
     * a logged entry with no way to fix it -- entries were previously
     * append-only by design (Section 3.3.1 frames the log as an immutable
     * audit trail), but "immutable" shouldn't mean "no recourse for a
     * seller's own data-entry mistake". Same seller-only authorisation as
     * addEntry; additionally verifies the entry actually belongs to this
     * listing's passport so a seller can't edit another listing's history
     * by guessing an entry id.
     */
    @Transactional
    public PassportResponse updateEntry(Long listingId, Long entryId, PassportEntryRequest request, Long requestingUserId) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        if (!listing.getSeller().getId().equals(requestingUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the seller can edit passport entries");
        }

        InstrumentPassport passport = passportRepository.findByListingId(listingId)
            .orElseThrow(() -> new RuntimeException("No passport found for listing: " + listingId));

        PassportEntry entry = passportEntryRepository.findById(entryId)
            .orElseThrow(() -> new RuntimeException("Passport entry not found: " + entryId));

        if (!entry.getPassport().getId().equals(passport.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Entry " + entryId + " does not belong to this listing's passport");
        }

        entry.setEntryType(request.getEntryType());
        entry.setDescription(request.getDescription());
        entry.setEventDate(request.getEventDate());
        passportEntryRepository.save(entry);

        return PassportResponse.from(passportRepository.findByListingId(listingId).orElseThrow());
    }

    private InstrumentPassport createPassportForListing(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        InstrumentPassport passport = InstrumentPassport.builder()
            .listing(listing)
            .build();

        return passportRepository.save(passport);
    }
}
