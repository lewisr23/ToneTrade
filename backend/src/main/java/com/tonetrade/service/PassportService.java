package com.tonetrade.service;

import com.tonetrade.dto.PassportEntryRequest;
import com.tonetrade.dto.PassportResponse;
import com.tonetrade.entity.InstrumentPassport;
import com.tonetrade.entity.Listing;
import com.tonetrade.entity.PassportEntry;
import com.tonetrade.repository.InstrumentPassportRepository;
import com.tonetrade.repository.ListingRepository;
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

    private InstrumentPassport createPassportForListing(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        InstrumentPassport passport = InstrumentPassport.builder()
            .listing(listing)
            .build();

        return passportRepository.save(passport);
    }
}
