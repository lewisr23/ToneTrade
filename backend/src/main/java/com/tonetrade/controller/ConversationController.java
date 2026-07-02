package com.tonetrade.controller;

import com.tonetrade.dto.ConversationResponse;
import com.tonetrade.dto.MessageRequest;
import com.tonetrade.dto.MessageResponse;
import com.tonetrade.entity.User;
import com.tonetrade.repository.UserRepository;
import com.tonetrade.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST side of messaging: listing conversations, fetching history, starting a
 * thread, and marking read. Real-time delivery of new messages happens over
 * STOMP (see ChatController) — the POST /messages endpoint here also
 * broadcasts to the same topic so it behaves consistently if ever called
 * before a socket is connected.
 */
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final MessagingService messagingService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getConversations(@AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(messagingService.getConversationsForUser(user.getId()));
    }

    @PostMapping
    public ResponseEntity<ConversationResponse> startConversation(
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Long listingId = body.get("listingId");
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(messagingService.startOrGetConversation(listingId, user.getId()));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(messagingService.getMessages(id, user.getId()));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long id,
            @RequestBody MessageRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        MessageResponse response = messagingService.sendMessage(id, user.getId(), request);
        messagingTemplate.convertAndSend("/topic/conversations/" + id, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/messages/{messageId}/accept")
    public ResponseEntity<MessageResponse> acceptOffer(
            @PathVariable Long id,
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        MessageResponse response = messagingService.respondToOffer(id, messageId, user.getId(), true);
        messagingTemplate.convertAndSend("/topic/conversations/" + id, response);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/messages/{messageId}/decline")
    public ResponseEntity<MessageResponse> declineOffer(
            @PathVariable Long id,
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        MessageResponse response = messagingService.respondToOffer(id, messageId, user.getId(), false);
        messagingTemplate.convertAndSend("/topic/conversations/" + id, response);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        messagingService.markRead(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
