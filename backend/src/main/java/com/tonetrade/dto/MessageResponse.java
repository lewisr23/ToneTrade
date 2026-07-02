package com.tonetrade.dto;

import com.tonetrade.entity.Message;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MessageResponse {

    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderUsername;
    private String content;
    private String messageType;
    private BigDecimal offerAmount;
    private LocalDateTime createdAt;

    public static MessageResponse from(Message message) {
        MessageResponse r = new MessageResponse();
        r.setId(message.getId());
        r.setConversationId(message.getConversation().getId());
        r.setSenderId(message.getSender().getId());
        r.setSenderUsername(message.getSender().getUsername());
        r.setContent(message.getContent());
        r.setMessageType(message.getMessageType().name());
        r.setOfferAmount(message.getOfferAmount());
        r.setCreatedAt(message.getCreatedAt());
        return r;
    }
}
