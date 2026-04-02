package com.banking.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class DepositRequest {
    @NotNull private UUID accountId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    private String description;
    private String currency = "USD";
}
