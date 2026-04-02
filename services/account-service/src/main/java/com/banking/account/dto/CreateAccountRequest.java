package com.banking.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateAccountRequest {

    @NotNull(message = "Customer ID is required")
    private UUID customerId;

    @NotBlank(message = "Account type is required")
    private String accountType;

    private BigDecimal initialDeposit = BigDecimal.ZERO;

    private String currency = "USD";
}
