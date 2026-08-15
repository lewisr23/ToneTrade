package com.tonetrade.repository;

import com.tonetrade.entity.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {

    boolean existsByFollowerIdAndFollowedId(Long followerId, Long followedId);

    long countByFollowedId(Long followedId);

    @Transactional
    void deleteByFollowerIdAndFollowedId(Long followerId, Long followedId);
}
