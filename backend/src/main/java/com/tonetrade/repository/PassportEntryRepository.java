package com.tonetrade.repository;

import com.tonetrade.entity.PassportEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PassportEntryRepository extends JpaRepository<PassportEntry, Long> {
}
