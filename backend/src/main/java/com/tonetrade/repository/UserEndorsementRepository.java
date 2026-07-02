package com.tonetrade.repository;

import com.tonetrade.entity.UserEndorsement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserEndorsementRepository extends JpaRepository<UserEndorsement, Long> {

    boolean existsByEndorserIdAndEndorsedId(Long endorserId, Long endorsedId);

    long countByEndorsedId(Long endorsedId);
}
