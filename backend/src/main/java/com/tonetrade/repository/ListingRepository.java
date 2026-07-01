package com.tonetrade.repository;

import com.tonetrade.entity.Listing;
import com.tonetrade.entity.Listing.Category;
import com.tonetrade.entity.Listing.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    // Browse with optional search + category filter — mirrors frontend filter logic
    @Query("""
        SELECT l FROM Listing l
        WHERE l.status = :status
        AND (:category IS NULL OR l.category = :category)
        ORDER BY l.createdAt DESC
    """)
    List<Listing> findByFilters(
        @Param("status") ListingStatus status,
        @Param("category") Category category
    );

    List<Listing> findBySellerId(Long sellerId);
}
