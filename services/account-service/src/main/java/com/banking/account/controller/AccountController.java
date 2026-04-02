package com.banking.account.controller;

import com.banking.account.dto.AccountResponse;
import com.banking.account.dto.ApiResponse;
import com.banking.account.dto.CreateAccountRequest;
import com.banking.account.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(
            @Valid @RequestBody CreateAccountRequest request) {
        log.info("POST /api/v1/accounts");
        AccountResponse response = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccount(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(accountService.getAccountById(id)));
    }

    @GetMapping("/number/{accountNumber}")
    public ResponseEntity<ApiResponse<AccountResponse>> getByNumber(@PathVariable String accountNumber) {
        return ResponseEntity.ok(ApiResponse.success(accountService.getAccountByNumber(accountNumber)));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(ApiResponse.success(accountService.getAccountsByCustomer(customerId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAllAccounts() {
        return ResponseEntity.ok(ApiResponse.success(accountService.getAllAccounts()));
    }

    @PatchMapping("/{id}/balance")
    public ResponseEntity<ApiResponse<Void>> updateBalance(
            @PathVariable UUID id,
            @RequestParam BigDecimal balance) {
        accountService.updateBalance(id, balance);
        return ResponseEntity.ok(ApiResponse.success("Balance updated", null));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Account Service is running");
    }
}
