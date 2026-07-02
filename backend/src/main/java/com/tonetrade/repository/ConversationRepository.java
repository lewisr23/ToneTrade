package com.tonetrade.repository;

import com.tonetrade.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByListingIdAndBuyerId(Long listingId, Long buyerId);

    @Query("SELECT c FROM Conversation c WHERE c.buyer.id = :userId OR c.seller.id = :userId ORDER BY c.lastMessageAt DESC")
    List<Conversation> findAllForUser(@Param("userId") Long userId);

    @Query("""
        SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Conversation c
        WHERE (c.buyer.id = :userA AND c.seller.id = :userB)
        OR (c.buyer.id = :userB AND c.seller.id = :userA)
    """)
    boolean existsBetweenUsers(@Param("userA") Long userA, @Param("userB") Long userB);
}
