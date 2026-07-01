package com.tonetrade.dto;

import com.tonetrade.entity.PassportEntry.EntryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class PassportEntryRequest {

    @NotNull
    private EntryType entryType;

    @NotBlank
    private String description;

    private LocalDate eventDate;
}
