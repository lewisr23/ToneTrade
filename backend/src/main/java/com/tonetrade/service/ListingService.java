package com.tonetrade.service;

import com.tonetrade.dto.ListingRequest;
import com.tonetrade.dto.ListingResponse;
import com.tonetrade.entity.Listing;
import com.tonetrade.entity.Listing.Category;
import com.tonetrade.entity.Listing.ListingStatus;
import com.tonetrade.entity.User;
import com.tonetrade.repository.ListingRepository;
import com.tonetrade.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ListingResponse> getListings(String search, String categoryStr) {
        Category category = null;
        if (categoryStr != null && !categoryStr.isBlank()) {
            try {
                category = Category.valueOf(categoryStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid category — treat as no filter
            }
        }

        String searchLower = (search != null && !search.isBlank()) ? search.toLowerCase() : null;

        // Active listings first, sold listings after — still visible (like eBay's
        // sold items) but never ahead of what's actually buyable. Two separate
        // queries + concat rather than one clever ORDER BY, so it's obvious what
        // it does and there's no JPQL enum-literal risk.
        List<Listing> active = listingRepository.findByFilters(ListingStatus.ACTIVE, category);
        List<Listing> sold = listingRepository.findByFilters(ListingStatus.SOLD, category);

        return Stream.concat(active.stream(), sold.stream())
            .filter(l -> searchLower == null || l.getTitle().toLowerCase().contains(searchLower))
            .map(ListingResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public ListingResponse getListingById(Long id) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + id));
        return ListingResponse.from(listing);
    }

    @Transactional
    public ListingResponse createListing(ListingRequest request, Long sellerId) {
        User seller = userRepository.findById(sellerId)
            .orElseThrow(() -> new RuntimeException("User not found: " + sellerId));

        Listing listing = Listing.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .price(request.getPrice())
            .location(request.getLocation())
            .category(request.getCategory())
            .condition(request.getCondition())
            .seller(seller)
            .build();

        return ListingResponse.from(listingRepository.save(listing));
    }

    @Transactional
    public void deleteListing(Long id, Long requestingUserId) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + id));

        if (!listing.getSeller().getId().equals(requestingUserId)) {
            throw new RuntimeException("Not authorised to delete this listing");
        }

        listing.setStatus(ListingStatus.REMOVED);
        listingRepository.save(listing);
    }
}
