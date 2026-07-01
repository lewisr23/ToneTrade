package com.tonetrade.dto;

import com.tonetrade.entity.InstrumentPassport;
import lombok.Data;
import java.util.List;

@Data
public class PassportResponse {

    private Long id;
    private Long listingId;
    private String serialNumber;
    private Integer yearManufactured;
    private List<PassportEntryResponse> entries;

    public static PassportResponse from(InstrumentPassport passport) {
        PassportResponse r = new PassportResponse();
        r.setId(passport.getId());
        r.setListingId(passport.getListing().getId());
        r.setSerialNumber(passport.getSerialNumber());
        r.setYearManufactured(passport.getYearManufactured());
        r.setEntries(passport.getEntries().stream()
            .map(PassportEntryResponse::from)
            .toList());
        return r;
    }
}
