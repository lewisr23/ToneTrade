package com.tonetrade.service;

import com.tonetrade.dto.ListingRequest;
import com.tonetrade.dto.ListingResponse;
import com.tonetrade.entity.Listing;
import com.tonetrade.entity.Listing.Category;
import com.tonetrade.entity.Listing.ListingStatus;
import com.tonetrade.entity.SavedListing;
import com.tonetrade.entity.User;
import com.tonetrade.repository.ListingRepository;
import com.tonetrade.repository.SavedListingRepository;
import com.tonetrade.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final SavedListingRepository savedListingRepository;

    // Fair price indicator thresholds (proposal objective 8) — deliberately
    // simple for a dissertation prototype, not a tuned pricing model. Below
    // 85% of the category average is flagged a good deal, above 115% is
    // flagged pricey, everything in between reads as a typical/fair price.
    private static final BigDecimal BELOW_AVERAGE_THRESHOLD = new BigDecimal("0.85");
    private static final BigDecimal ABOVE_AVERAGE_THRESHOLD = new BigDecimal("1.15");
    // Need at least this many listings in the category (including the one
    // being viewed) before showing an assessment — otherwise one or two data
    // points could produce a misleading "above/below average" claim.
    private static final int MIN_SAMPLE_SIZE = 3;

    // Secondary, supplementary pricing signal: rough typical UK secondhand
    // resale prices for a handful of recognisable specific models, matched by
    // a simple case-insensitive substring check against the listing title.
    //
    // Deliberately NOT a live external pricing API (Reverb/eBay/Facebook
    // Marketplace scraping) — no free API exposes aggregated secondhand
    // pricing, scraping any of those risks ToS violations and is unreliable
    // to demo live, and building real title-to-model NLP matching is a bigger
    // scope than a fair price *indicator* warrants. This table is a deliberate
    // scope decision, documented as such in the dissertation, not an oversight.
    //
    // NOTE for Lewis: these are rough estimates for demo purposes — sanity
    // check/adjust the actual values against your own market knowledge before
    // using them in the demo video or write-up.
    private static final Map<String, BigDecimal> MODEL_REFERENCE_PRICES = new LinkedHashMap<>();
    static {
        MODEL_REFERENCE_PRICES.put("Fender Stratocaster", new BigDecimal("500"));
        MODEL_REFERENCE_PRICES.put("Fender Telecaster", new BigDecimal("550"));
        MODEL_REFERENCE_PRICES.put("Squier Stratocaster", new BigDecimal("220"));
        MODEL_REFERENCE_PRICES.put("Gibson Les Paul", new BigDecimal("1200"));
        MODEL_REFERENCE_PRICES.put("Yamaha Pacifica", new BigDecimal("250"));
        MODEL_REFERENCE_PRICES.put("Roland TD-17", new BigDecimal("900"));
        MODEL_REFERENCE_PRICES.put("Roland Juno-106", new BigDecimal("1400"));
        MODEL_REFERENCE_PRICES.put("Roland TB-303", new BigDecimal("900"));
        MODEL_REFERENCE_PRICES.put("Pearl Export", new BigDecimal("400"));
        MODEL_REFERENCE_PRICES.put("Yamaha Stage Custom", new BigDecimal("450"));
        MODEL_REFERENCE_PRICES.put("Shure SM58", new BigDecimal("70"));
        MODEL_REFERENCE_PRICES.put("Shure SM7B", new BigDecimal("300"));
        MODEL_REFERENCE_PRICES.put("Rode NT1", new BigDecimal("150"));
        MODEL_REFERENCE_PRICES.put("Korg Minilogue", new BigDecimal("350"));
        MODEL_REFERENCE_PRICES.put("Teenage Engineering OP-1", new BigDecimal("900"));
        MODEL_REFERENCE_PRICES.put("Novation Bass Station", new BigDecimal("200"));
        MODEL_REFERENCE_PRICES.put("Focusrite Scarlett 2i2", new BigDecimal("90"));
        MODEL_REFERENCE_PRICES.put("Zoom H4n", new BigDecimal("110"));
        MODEL_REFERENCE_PRICES.put("Pioneer DDJ-400", new BigDecimal("180"));
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> getListings(String search, String categoryStr) {
        return getListings(search, categoryStr, null, null);
    }

    // minPrice/maxPrice added 2026-07-28 in response to usability testing
    // (P1-P4) — browsing only had category + free-text search, no way to
    // narrow by price at all. Filtered in-memory alongside the existing
    // search filter rather than pushed into the JPQL query, matching how
    // search already works here — the listing count for a dissertation demo
    // is small enough that this isn't a performance concern.
    @Transactional(readOnly = true)
    public List<ListingResponse> getListings(String search, String categoryStr, BigDecimal minPrice, BigDecimal maxPrice) {
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
            .filter(l -> minPrice == null || l.getPrice().compareTo(minPrice) >= 0)
            .filter(l -> maxPrice == null || l.getPrice().compareTo(maxPrice) <= 0)
            .map(ListingResponse::from)
            .toList();
    }

    // viewerId is null for anonymous visitors (endpoint is public) — see
    // ListingController.getListing, which mirrors the same optional-principal
    // pattern used by UserController.getSellerProfile.
    @Transactional(readOnly = true)
    public ListingResponse getListingById(Long id, Long viewerId) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + id));
        ListingResponse response = ListingResponse.from(listing);
        applyPriceContext(response, listing);
        applyReferencePrice(response, listing);
        if (viewerId != null) {
            response.setSavedByViewer(savedListingRepository.existsByUserIdAndListingId(viewerId, id));
        }
        return response;
    }

    // Populates the fair price indicator fields on an already-built ListingResponse.
    // Lives in the service (not ListingResponse.from) because it needs repository
    // access — from() stays a pure entity-to-DTO mapper like every other field on it.
    private void applyPriceContext(ListingResponse response, Listing listing) {
        long sampleSize = listingRepository.countForCategory(listing.getCategory(), ListingStatus.REMOVED);
        response.setCategorySampleSize((int) sampleSize);

        BigDecimal average = sampleSize >= MIN_SAMPLE_SIZE
            ? listingRepository.averagePriceForCategory(listing.getCategory(), ListingStatus.REMOVED)
            : null;

        if (average == null) {
            response.setPriceAssessment("INSUFFICIENT_DATA");
            return;
        }

        average = average.setScale(2, RoundingMode.HALF_UP);
        response.setCategoryAveragePrice(average);

        BigDecimal lowerBound = average.multiply(BELOW_AVERAGE_THRESHOLD);
        BigDecimal upperBound = average.multiply(ABOVE_AVERAGE_THRESHOLD);

        if (listing.getPrice().compareTo(lowerBound) < 0) {
            response.setPriceAssessment("BELOW_AVERAGE");
        } else if (listing.getPrice().compareTo(upperBound) > 0) {
            response.setPriceAssessment("ABOVE_AVERAGE");
        } else {
            response.setPriceAssessment("TYPICAL");
        }
    }

    // Supplementary model-specific reference price — see MODEL_REFERENCE_PRICES
    // comment above for why this is a small hardcoded table and not a live
    // external lookup. First case-insensitive substring match wins.
    private void applyReferencePrice(ListingResponse response, Listing listing) {
        String titleLower = listing.getTitle().toLowerCase();
        for (Map.Entry<String, BigDecimal> entry : MODEL_REFERENCE_PRICES.entrySet()) {
            if (titleLower.contains(entry.getKey().toLowerCase())) {
                response.setReferenceModelName(entry.getKey());
                response.setReferenceModelPrice(entry.getValue());
                return;
            }
        }
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

    /**
     * Edit an existing listing's core fields (title/description/price/location/
     * category/condition) — seller-only, same ownership check as deleteListing.
     * Media (photos/audio/video) is handled separately, via MediaController's
     * add/delete endpoints — this method only ever touches the text fields.
     */
    @Transactional
    public ListingResponse updateListing(Long id, ListingRequest request, Long requestingUserId) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + id));

        if (!listing.getSeller().getId().equals(requestingUserId)) {
            throw new RuntimeException("Not authorised to edit this listing");
        }

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setLocation(request.getLocation());
        listing.setCategory(request.getCategory());
        listing.setCondition(request.getCondition());

        return ListingResponse.from(listingRepository.save(listing));
    }

    /**
     * Direct "Buy Now" purchase at the listed price — buyer-only, marks the
     * listing SOLD immediately with no negotiation step required. This is
     * deliberately separate from MessagingService.respondToOffer (the
     * accept-an-offer path): that flow can change the listing's price to
     * whatever was negotiated, whereas a direct buy keeps the listed price
     * as-is since nothing was negotiated. Added 2026-07-25 — Lewis pointed
     * out that before this, a listing's price was cosmetic: the only way to
     * actually sell was via messaging + a price offer + accept, so a fixed
     * listed price had no direct purchase path. Same "already sold" guard as
     * MessagingService.startOrGetConversation/sendMessage for consistency.
     */
    @Transactional
    public ListingResponse buyListing(Long id, Long buyerId) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + id));

        if (listing.getSeller().getId().equals(buyerId)) {
            throw new RuntimeException("Sellers can't buy their own listing");
        }
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new RuntimeException("This listing is no longer available");
        }

        listing.setStatus(ListingStatus.SOLD);
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

    /** Save/bookmark a listing for later. Idempotent — saving twice is a no-op, not an error. */
    @Transactional
    public void saveListing(Long userId, Long listingId) {
        if (savedListingRepository.existsByUserIdAndListingId(userId, listingId)) {
            return;
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));
        savedListingRepository.save(SavedListing.builder().user(user).listing(listing).build());
    }

    /** Unsave — a no-op (not an error) if it wasn't saved. */
    @Transactional
    public void unsaveListing(Long userId, Long listingId) {
        savedListingRepository.deleteByUserIdAndListingId(userId, listingId);
    }

    /** All of a user's saved listings, most recently saved first. */
    @Transactional(readOnly = true)
    public List<ListingResponse> getSavedListings(Long userId) {
        return savedListingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(saved -> {
                ListingResponse r = ListingResponse.from(saved.getListing());
                r.setSavedByViewer(true);
                return r;
            })
            .toList();
    }
}
