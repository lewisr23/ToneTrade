package com.tonetrade.dto;

import com.tonetrade.entity.Listing.Category;
import com.tonetrade.entity.Listing.Condition;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ListingRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100)
    private String title;

    @Size(max = 2000)
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Category is required")
    private Category category;

    private Condition condition = Condition.GOOD;
}
