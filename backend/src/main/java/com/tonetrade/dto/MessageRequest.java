package com.tonetrade.dto;

import com.tonetrade.entity.Message.MessageType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MessageRequest {

    private String content;

    private MessageType messageType = MessageType.TEXT;

    // Only required when messageType == PRICE_OFFER
    private BigDecimal offerAmount;
}
