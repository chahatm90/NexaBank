package com.banking.transaction.service;

import com.banking.transaction.dto.AccountDto;
import com.banking.transaction.exception.AccountServiceException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.account-service.url}")
    private String accountServiceUrl;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public AccountDto getAccount(UUID accountId) {
        try {
            String url = accountServiceUrl + "/api/v1/accounts/" + accountId;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Object data = ((Map<?, ?>) response.getBody()).get("data");
                return objectMapper.convertValue(data, AccountDto.class);
            }
            throw new AccountServiceException("Failed to fetch account: " + accountId);
        } catch (AccountServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching account {}: {}", accountId, e.getMessage());
            throw new AccountServiceException("Account service error: " + e.getMessage());
        }
    }

    public void updateBalance(UUID accountId, BigDecimal newBalance) {
    try {
        String url = accountServiceUrl + "/api/v1/accounts/" + accountId + "/balance?balance=" + newBalance;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);
        restTemplate.exchange(url, HttpMethod.PATCH, entity, Map.class);
    } catch (Exception e) {
        log.error("Error updating balance for {}: {}", accountId, e.getMessage());
        throw new AccountServiceException("Failed to update balance: " + e.getMessage());
    }
    }
}