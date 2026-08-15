package com.tonetrade.dto;

import com.tonetrade.entity.Listing;
import com.tonetrade.entity.ListingMedia;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ListingResponse {

    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private String location;
    private String category;
    private String condition;
    private String status;
    private LocalDateTime createdAt;

    // Seller summary
    private Long sellerId;
    private String sellerUsername;
    private boolean sellerVerified;

    // Whether this listing has an instrument passport
    private boolean hasPassport;

    // Media URLs grouped by type
    private List<String> imageUrls;
    private List<String> audioUrls;
    private List<String> videoUrls;

    // Fair price indicator (proposal objective 8) — pricing context relative
    // to other listings in the same category. Only populated on the single-
    // listing detail endpoint (ListingService.getListingById), not the browse
    // list, since the objective is scoped to "within individual listings" and
    // computing it per-row on the browse grid would be an avoidable N+1.
    // priceAssessment is one of: BELOW_AVERAGE, TYPICAL, ABOVE_AVERAGE, INSUFFICIENT_DATA
    private String priceAssessment;
    private BigDecimal categoryAveragePrice;
    private int categorySampleSize;

    // Secondary, supplementary signal: a rough typical resale price for a
    // recognised specific model (e.g. "Fender Stratocaster"), matched against
    // the listing title against a small hardcoded reference table. Deliberately
    // NOT a live external pricing API — see ListingService.MODEL_REFERENCE_PRICES
    // comment for the reasoning (ToS risk, reliability, no free aggregated
    // secondhand-instrument pricing source exists). Null when no model matches.
    private String referenceModelName;
    private BigDecimal referenceModelPrice;

    // Whether the current viewer has saved/bookmarked this listing. Same
    // scoping rule as priceAssessment above: only populated on the
    // single-listing detail endpoint (needs a viewerId, which the browse
    // list doesn't compute per-row to avoid N+1). False for anonymous
    // viewers and for the browse grid.
    private boolean savedByViewer;

    public static ListingResponse from(Listing listing) {
        ListingResponse r = new ListingResponse();
        r.setId(listing.getId());
        r.setTitle(listing.getTitle());
        r.setDescription(listing.getDescription());
        r.setPrice(listing.getPrice());
        r.setLocation(listing.getLocation());
        r.setCategory(listing.getCategory().name());
        r.setCondition(listing.getCondition().name());
        r.setStatus(listing.getStatus().name());
        r.setCreatedAt(listing.getCreatedAt());
        r.setSellerId(listing.getSeller().getId());
        r.setSellerUsername(listing.getSeller().getUsername());
        r.setSellerVerified(listing.getSeller().isVerified());
        r.setHasPassport(listing.getPassport() != null);

        if (listing.getMedia() != null) {
            r.setImageUrls(listing.getMedia().stream()
                .filter(m -> m.getMediaType() == ListingMedia.MediaType.IMAGE)
                .map(ListingMedia::getUrl).toList());
            r.setAudioUrls(listing.getMedia().stream()
                .filter(m -> m.getMediaType() == ListingMedia.MediaType.AUDIO)
                .map(ListingMedia::getUrl).toList());
            r.setVideoUrls(listing.getMedia().stream()
                .filter(m -> m.getMediaType() == ListingMedia.MediaType.VIDEO)
                .map(ListingMedia::getUrl).toList());
        }

        return r;
    }
}
