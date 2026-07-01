package com.tonetrade.repository;

import com.tonetrade.entity.InstrumentPassport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InstrumentPassportRepository extends JpaRepository<InstrumentPassport, Long> {
    Optional<InstrumentPassport> findByListingId(Long listingId);
}
