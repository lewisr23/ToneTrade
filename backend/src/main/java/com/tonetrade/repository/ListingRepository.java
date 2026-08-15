package com.tonetrade.repository;

import com.tonetrade.entity.Listing;
import com.tonetrade.entity.Listing.Category;
import com.tonetrade.entity.Listing.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
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

    // Fair price indicator (proposal objective 8) — average price across all
    // non-removed listings in a category, used as the pricing-context baseline
    // for an individual listing. Excludes REMOVED rather than restricting to
    // just ACTIVE so that SOLD listings (real completed transactions) still
    // count towards the average — they're arguably a stronger price signal
    // than an active asking price nobody's paid yet.
    @Query("""
        SELECT AVG(l.price) FROM Listing l
        WHERE l.category = :category
        AND l.status <> :excludedStatus
    """)
    BigDecimal averagePriceForCategory(
        @Param("category") Category category,
        @Param("excludedStatus") ListingStatus excludedStatus
    );

    @Query("""
        SELECT COUNT(l) FROM Listing l
        WHERE l.category = :category
        AND l.status <> :excludedStatus
    """)
    long countForCategory(
        @Param("category") Category category,
        @Param("excludedStatus") ListingStatus excludedStatus
    );
}
