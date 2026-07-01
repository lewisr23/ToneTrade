package com.tonetrade.dto;

import com.tonetrade.entity.PassportEntry;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PassportEntryResponse {

    private Long id;
    private String entryType;
    private String description;
    private LocalDate eventDate;
    private LocalDateTime createdAt;

    public static PassportEntryResponse from(PassportEntry entry) {
        PassportEntryResponse r = new PassportEntryResponse();
        r.setId(entry.getId());
        r.setEntryType(entry.getEntryType().name());
        r.setDescription(entry.getDescription());
        r.setEventDate(entry.getEventDate());
        r.setCreatedAt(entry.getCreatedAt());
        return r;
    }
}
