package com.banking.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransferRequest {
    @NotNull private UUID sourceAccountId;
    @NotNull private UUID destinationAccountId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    private String description;
}
