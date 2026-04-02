package com.banking.transaction.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class TransactionResponse {
    private UUID id;
    private String transactionRef;
    private UUID accountId;
    private String transactionType;
    private BigDecimal amount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private String currency;
    private String description;
    private UUID destinationAccountId;
    private String status;
    private LocalDateTime createdAt;
}
