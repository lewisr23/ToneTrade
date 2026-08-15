package com.tonetrade.repository;

import com.tonetrade.entity.SavedListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface SavedListingRepository extends JpaRepository<SavedListing, Long> {

    boolean existsByUserIdAndListingId(Long userId, Long listingId);

    List<SavedListing> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Transactional
    void deleteByUserIdAndListingId(Long userId, Long listingId);
}
