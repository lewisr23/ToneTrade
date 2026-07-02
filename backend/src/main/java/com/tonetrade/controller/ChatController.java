package com.tonetrade.controller;

import com.tonetrade.dto.MessageRequest;
import com.tonetrade.dto.MessageResponse;
import com.tonetrade.entity.User;
import com.tonetrade.repository.UserRepository;
import com.tonetrade.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * Real-time send path. Client publishes to /app/chat/{conversationId}/send
 * (authenticated via the STOMP CONNECT frame — see StompAuthChannelInterceptor,
 * never trusting a client-supplied sender). We persist through the same
 * MessagingService the REST API uses, then broadcast to everyone subscribed
 * to /topic/conversations/{conversationId}.
 */
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final MessagingService messagingService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{conversationId}/send")
    public void send(@DestinationVariable Long conversationId, MessageRequest request, Principal principal) {
        if (principal == null) {
            return;
        }

        User sender = userRepository.findByEmail(principal.getName()).orElse(null);
        if (sender == null) {
            return;
        }

        MessageResponse response = messagingService.sendMessage(conversationId, sender.getId(), request);
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);
    }
}
