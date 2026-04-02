package com.banking.account.service;

import com.banking.account.dto.AccountResponse;
import com.banking.account.dto.CreateAccountRequest;
import com.banking.account.exception.AccountNotFoundException;
import com.banking.account.model.BankAccount;
import com.banking.account.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {

    private final AccountRepository accountRepository;

    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {
        log.info("Creating account for customer: {}", request.getCustomerId());

        String accountNumber = generateAccountNumber();

        BankAccount account = BankAccount.builder()
                .accountNumber(accountNumber)
                .customerId(request.getCustomerId())
                .accountType(BankAccount.AccountType.valueOf(request.getAccountType().toUpperCase()))
                .balance(request.getInitialDeposit() != null ? request.getInitialDeposit() : BigDecimal.ZERO)
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .status(BankAccount.AccountStatus.ACTIVE)
                .build();

        BankAccount saved = accountRepository.save(account);
        log.info("Account created: {}", saved.getAccountNumber());
        return mapToResponse(saved);
    }

    public AccountResponse getAccountById(UUID id) {
        BankAccount account = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + id));
        return mapToResponse(account);
    }

    public AccountResponse getAccountByNumber(String accountNumber) {
        BankAccount account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + accountNumber));
        return mapToResponse(account);
    }

    public List<AccountResponse> getAccountsByCustomer(UUID customerId) {
        return accountRepository.findByCustomerId(customerId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void updateBalance(UUID accountId, BigDecimal newBalance) {
        BankAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + accountId));
        account.setBalance(newBalance);
        accountRepository.save(account);
        log.info("Balance updated for account {}: {}", accountId, newBalance);
    }

    private String generateAccountNumber() {
        long count = accountRepository.count() + 1;
        return String.format("ACC-%010d", count);
    }

    private AccountResponse mapToResponse(BankAccount account) {
        AccountResponse r = new AccountResponse();
        r.setId(account.getId());
        r.setAccountNumber(account.getAccountNumber());
        r.setCustomerId(account.getCustomerId());
        r.setAccountType(account.getAccountType().name());
        r.setBalance(account.getBalance());
        r.setCurrency(account.getCurrency());
        r.setStatus(account.getStatus().name());
        r.setCreatedAt(account.getCreatedAt());
        r.setUpdatedAt(account.getUpdatedAt());
        return r;
    }
}
