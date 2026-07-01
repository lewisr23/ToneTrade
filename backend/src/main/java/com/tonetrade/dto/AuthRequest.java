package com.tonetrade.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {

    @NotBlank
    private String login; // accepts email or username

    @NotBlank
    private String password;
}
