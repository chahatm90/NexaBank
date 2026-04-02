package com.banking.notification.service;

import com.banking.notification.model.NotificationRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class NotificationService {

    public void sendNotification(NotificationRequest request) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        log.info("╔══════════════════════════════════════════════════════");
        log.info("║ NOTIFICATION [{}]", timestamp);
        log.info("║ Type      : {}", request.getType());
        log.info("║ Recipient : {}", request.getRecipientId());
        log.info("║ Channel   : {}", request.getChannel() != null ? request.getChannel() : "EMAIL");
        log.info("║ Subject   : {}", request.getSubject());
        log.info("║ Message   : {}", request.getMessage());
        log.info("╚══════════════════════════════════════════════════════");
    }
}
