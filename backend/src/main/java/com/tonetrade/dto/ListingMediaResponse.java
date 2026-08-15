package com.tonetrade.dto;

import com.tonetrade.entity.ListingMedia;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ListingMediaResponse {

    private Long id;
    private String mediaType;
    private String url;
    private String label;
    private LocalDateTime uploadedAt;

    public static ListingMediaResponse from(ListingMedia media) {
        ListingMediaResponse r = new ListingMediaResponse();
        r.setId(media.getId());
        r.setMediaType(media.getMediaType().name());
        r.setUrl(media.getUrl());
        r.setLabel(media.getLabel());
        r.setUploadedAt(media.getUploadedAt());
        return r;
    }
}
