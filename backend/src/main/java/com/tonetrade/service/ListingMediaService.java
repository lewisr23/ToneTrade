package com.tonetrade.service;

import com.tonetrade.entity.Listing;
import com.tonetrade.entity.ListingMedia;
import com.tonetrade.repository.ListingMediaRepository;
import com.tonetrade.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListingMediaService {

    @Value("${tonetrade.upload.dir:uploads}")
    private String uploadDir;

    private final ListingMediaRepository listingMediaRepository;
    private final ListingRepository listingRepository;

    /**
     * Uploads one media file (image/audio/video) and attaches it to a listing.
     * Only the listing's seller can add media to it.
     */
    @Transactional
    public ListingMedia uploadMedia(Long listingId, Long requestingSellerId, MultipartFile file, String mediaTypeStr, String label) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        if (!listing.getSeller().getId().equals(requestingSellerId)) {
            throw new RuntimeException("Not authorised to add media to this listing");
        }

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("No file provided");
        }

        ListingMedia.MediaType mediaType;
        try {
            mediaType = ListingMedia.MediaType.valueOf(mediaTypeStr.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new RuntimeException("Invalid media type: " + mediaTypeStr);
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType();
        boolean typeMatches = switch (mediaType) {
            case IMAGE -> contentType.startsWith("image/");
            case AUDIO -> contentType.startsWith("audio/");
            case VIDEO -> contentType.startsWith("video/");
        };
        if (!typeMatches) {
            throw new RuntimeException("File content (" + contentType + ") doesn't match declared type " + mediaType);
        }

        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String extension = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
        String storedFilename = UUID.randomUUID() + extension;

        try {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path target = dir.resolve(storedFilename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store uploaded file", e);
        }

        ListingMedia media = ListingMedia.builder()
            .listing(listing)
            .mediaType(mediaType)
            .url("/uploads/" + storedFilename)
            .label(label)
            .build();

        return listingMediaRepository.save(media);
    }

    @Transactional(readOnly = true)
    public List<ListingMedia> getMediaForListing(Long listingId) {
        return listingMediaRepository.findByListingIdOrderByUploadedAtAsc(listingId);
    }

    /**
     * Removes a single media item from a listing. Only the listing's seller
     * can remove media from it. File deletion from disk is best-effort --
     * if the file is already missing or the delete fails for some other
     * reason, the DB record is still removed rather than leaving a
     * dangling, unremovable media entry the seller can't get rid of.
     */
    @Transactional
    public void deleteMedia(Long listingId, Long mediaId, Long requestingSellerId) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        if (!listing.getSeller().getId().equals(requestingSellerId)) {
            throw new RuntimeException("Not authorised to remove media from this listing");
        }

        ListingMedia media = listingMediaRepository.findById(mediaId)
            .orElseThrow(() -> new RuntimeException("Media not found: " + mediaId));

        if (!media.getListing().getId().equals(listingId)) {
            throw new RuntimeException("Media " + mediaId + " does not belong to listing " + listingId);
        }

        listingMediaRepository.delete(media);

        try {
            String url = media.getUrl();
            String filename = url.startsWith("/uploads/") ? url.substring("/uploads/".length()) : null;
            if (filename != null) {
                Path target = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
                Files.deleteIfExists(target);
            }
        } catch (IOException e) {
            // Best-effort only -- the DB record is already gone, which is
            // what actually matters to the user. An orphaned file on disk
            // is a cleanup nicety, not something worth failing the request
            // over.
        }
    }
}
