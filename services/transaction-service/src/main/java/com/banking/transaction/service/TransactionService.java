package com.banking.transaction.service;

import com.banking.transaction.dto.*;
import com.banking.transaction.exception.InsufficientFundsException;
import com.banking.transaction.exception.InvalidTransactionException;
import com.banking.transaction.model.Transaction;
import com.banking.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountServiceClient accountServiceClient;

    @Transactional
    public TransactionResponse deposit(DepositRequest request) {
        log.info("Deposit {} to account {}", request.getAmount(), request.getAccountId());

        AccountDto account = accountServiceClient.getAccount(request.getAccountId());
        validateAccountActive(account);

        BigDecimal balanceBefore = account.getBalance();
        BigDecimal balanceAfter = balanceBefore.add(request.getAmount());

        accountServiceClient.updateBalance(request.getAccountId(), balanceAfter);

        Transaction tx = Transaction.builder()
                .transactionRef(generateRef())
                .accountId(request.getAccountId())
                .transactionType(Transaction.TransactionType.DEPOSIT)
                .amount(request.getAmount())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .description(request.getDescription() != null ? request.getDescription() : "Deposit")
                .status(Transaction.TransactionStatus.COMPLETED)
                .build();

        return mapToResponse(transactionRepository.save(tx));
    }

    @Transactional
    public TransactionResponse withdraw(WithdrawRequest request) {
        log.info("Withdrawal {} from account {}", request.getAmount(), request.getAccountId());

        AccountDto account = accountServiceClient.getAccount(request.getAccountId());
        validateAccountActive(account);

        BigDecimal balanceBefore = account.getBalance();
        if (balanceBefore.compareTo(request.getAmount()) < 0) {
            throw new InsufficientFundsException(
                    "Insufficient funds. Available: " + balanceBefore + ", Requested: " + request.getAmount());
        }

        BigDecimal balanceAfter = balanceBefore.subtract(request.getAmount());
        accountServiceClient.updateBalance(request.getAccountId(), balanceAfter);

        Transaction tx = Transaction.builder()
                .transactionRef(generateRef())
                .accountId(request.getAccountId())
                .transactionType(Transaction.TransactionType.WITHDRAWAL)
                .amount(request.getAmount())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .currency("USD")
                .description(request.getDescription() != null ? request.getDescription() : "Withdrawal")
                .status(Transaction.TransactionStatus.COMPLETED)
                .build();

        return mapToResponse(transactionRepository.save(tx));
    }

    @Transactional
    public TransactionResponse transfer(TransferRequest request) {
        log.info("Transfer {} from {} to {}", request.getAmount(),
                request.getSourceAccountId(), request.getDestinationAccountId());

        if (request.getSourceAccountId().equals(request.getDestinationAccountId())) {
            throw new InvalidTransactionException("Source and destination accounts cannot be the same");
        }

        AccountDto source = accountServiceClient.getAccount(request.getSourceAccountId());
        AccountDto destination = accountServiceClient.getAccount(request.getDestinationAccountId());

        validateAccountActive(source);
        validateAccountActive(destination);

        BigDecimal srcBalanceBefore = source.getBalance();
        if (srcBalanceBefore.compareTo(request.getAmount()) < 0) {
            throw new InsufficientFundsException(
                    "Insufficient funds. Available: " + srcBalanceBefore + ", Requested: " + request.getAmount());
        }

        BigDecimal srcBalanceAfter = srcBalanceBefore.subtract(request.getAmount());
        BigDecimal dstBalanceBefore = destination.getBalance();
        BigDecimal dstBalanceAfter = dstBalanceBefore.add(request.getAmount());

        accountServiceClient.updateBalance(request.getSourceAccountId(), srcBalanceAfter);
        accountServiceClient.updateBalance(request.getDestinationAccountId(), dstBalanceAfter);

        String ref = generateRef();
        String desc = request.getDescription() != null ? request.getDescription() : "Transfer";

        // Debit transaction
        Transaction debit = Transaction.builder()
                .transactionRef(ref + "-DR")
                .accountId(request.getSourceAccountId())
                .transactionType(Transaction.TransactionType.TRANSFER)
                .amount(request.getAmount())
                .balanceBefore(srcBalanceBefore)
                .balanceAfter(srcBalanceAfter)
                .currency("USD")
                .description(desc + " (debit)")
                .destinationAccountId(request.getDestinationAccountId())
                .status(Transaction.TransactionStatus.COMPLETED)
                .build();

        // Credit transaction
        Transaction credit = Transaction.builder()
                .transactionRef(ref + "-CR")
                .accountId(request.getDestinationAccountId())
                .transactionType(Transaction.TransactionType.TRANSFER)
                .amount(request.getAmount())
                .balanceBefore(dstBalanceBefore)
                .balanceAfter(dstBalanceAfter)
                .currency("USD")
                .description(desc + " (credit)")
                .destinationAccountId(request.getSourceAccountId())
                .status(Transaction.TransactionStatus.COMPLETED)
                .build();

        transactionRepository.save(credit);
        return mapToResponse(transactionRepository.save(debit));
    }

    public List<TransactionResponse> getTransactionHistory(UUID accountId) {
        return transactionRepository.findByAccountIdOrderByCreatedAtDesc(accountId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<TransactionResponse> getTransactionHistory(UUID accountId, int page, int size) {
        return transactionRepository.findByAccountIdOrderByCreatedAtDesc(
                        accountId, PageRequest.of(page, size))
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<TransactionResponse> getRecentTransactions() {
        return transactionRepository.findTop10ByOrderByCreatedAtDesc()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private void validateAccountActive(AccountDto account) {
        if (!"ACTIVE".equals(account.getStatus())) {
            throw new InvalidTransactionException("Account " + account.getAccountNumber() + " is not active");
        }
    }

    private String generateRef() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = new Random().nextInt(9000) + 1000;
        return "TXN-" + date + "-" + rand;
    }

    private TransactionResponse mapToResponse(Transaction tx) {
        TransactionResponse r = new TransactionResponse();
        r.setId(tx.getId());
        r.setTransactionRef(tx.getTransactionRef());
        r.setAccountId(tx.getAccountId());
        r.setTransactionType(tx.getTransactionType().name());
        r.setAmount(tx.getAmount());
        r.setBalanceBefore(tx.getBalanceBefore());
        r.setBalanceAfter(tx.getBalanceAfter());
        r.setCurrency(tx.getCurrency());
        r.setDescription(tx.getDescription());
        r.setDestinationAccountId(tx.getDestinationAccountId());
        r.setStatus(tx.getStatus().name());
        r.setCreatedAt(tx.getCreatedAt());
        return r;
    }
}
