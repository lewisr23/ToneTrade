package com.tonetrade.repository;

import com.tonetrade.entity.ListingMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingMediaRepository extends JpaRepository<ListingMedia, Long> {

    List<ListingMedia> findByListingIdOrderByUploadedAtAsc(Long listingId);
}
