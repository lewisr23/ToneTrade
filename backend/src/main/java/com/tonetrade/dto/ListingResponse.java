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
