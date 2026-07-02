package com.tonetrade.service;

import com.tonetrade.dto.ConversationResponse;
import com.tonetrade.dto.MessageRequest;
import com.tonetrade.dto.MessageResponse;
import com.tonetrade.entity.Conversation;
import com.tonetrade.entity.Listing;
import com.tonetrade.entity.Message;
import com.tonetrade.entity.User;
import com.tonetrade.repository.ConversationRepository;
import com.tonetrade.repository.ListingRepository;
import com.tonetrade.repository.MessageRepository;
import com.tonetrade.repository.UserEndorsementRepository;
import com.tonetrade.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final UserEndorsementRepository userEndorsementRepository;

    @Transactional
    public ConversationResponse startOrGetConversation(Long listingId, Long requestingUserId) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        if (listing.getSeller().getId().equals(requestingUserId)) {
            throw new RuntimeException("Sellers can't message themselves about their own listing");
        }
        if (listing.getStatus() == Listing.ListingStatus.SOLD) {
            throw new RuntimeException("This listing has already sold");
        }

        Conversation conversation = conversationRepository.findByListingIdAndBuyerId(listingId, requestingUserId)
            .orElseGet(() -> {
                User buyer = userRepository.findById(requestingUserId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + requestingUserId));
                Conversation c = Conversation.builder()
                    .listing(listing)
                    .buyer(buyer)
                    .seller(listing.getSeller())
                    .build();
                return conversationRepository.save(c);
            });

        return toResponse(conversation, requestingUserId);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversationsForUser(Long userId) {
        return conversationRepository.findAllForUser(userId).stream()
            .map(c -> toResponse(c, userId))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long conversationId, Long requestingUserId) {
        Conversation conversation = getConversationForParticipant(conversationId, requestingUserId);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream()
            .map(MessageResponse::from)
            .toList();
    }

    @Transactional
    public MessageResponse sendMessage(Long conversationId, Long senderId, MessageRequest request) {
        Conversation conversation = getConversationForParticipant(conversationId, senderId);
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("User not found: " + senderId));

        Message.MessageType type = request.getMessageType() != null ? request.getMessageType() : Message.MessageType.TEXT;

        if ((request.getContent() == null || request.getContent().isBlank()) && type != Message.MessageType.PRICE_OFFER) {
            throw new RuntimeException("Message content cannot be empty");
        }
        if (type == Message.MessageType.PRICE_OFFER) {
            if (request.getOfferAmount() == null) {
                throw new RuntimeException("Price offer must include an amount");
            }
            if (!conversation.getBuyer().getId().equals(senderId)) {
                throw new RuntimeException("Only the buyer can make a price offer");
            }
            if (conversation.getListing().getStatus() == Listing.ListingStatus.SOLD) {
                throw new RuntimeException("This listing has already sold — offers are closed");
            }
        }

        Message message = Message.builder()
            .conversation(conversation)
            .sender(sender)
            .content(request.getContent() != null ? request.getContent() : "")
            .messageType(type)
            .offerAmount(request.getOfferAmount())
            .offerStatus(type == Message.MessageType.PRICE_OFFER ? Message.OfferStatus.PENDING : null)
            .build();

        messageRepository.save(message);

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return MessageResponse.from(message);
    }

    @Transactional
    public MessageResponse respondToOffer(Long conversationId, Long messageId, Long requestingUserId, boolean accept) {
        Conversation conversation = getConversationForParticipant(conversationId, requestingUserId);

        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found: " + messageId));

        if (!message.getConversation().getId().equals(conversation.getId())) {
            throw new RuntimeException("Message does not belong to this conversation");
        }
        if (message.getMessageType() != Message.MessageType.PRICE_OFFER) {
            throw new RuntimeException("Only price offers can be accepted or declined");
        }
        if (message.getSender().getId().equals(requestingUserId)) {
            throw new RuntimeException("You can't respond to your own offer");
        }
        if (message.getOfferStatus() != Message.OfferStatus.PENDING) {
            throw new RuntimeException("This offer has already been responded to");
        }

        message.setOfferStatus(accept ? Message.OfferStatus.ACCEPTED : Message.OfferStatus.DECLINED);
        messageRepository.save(message);

        // Accepting an offer closes the deal: the listing is marked sold at the
        // agreed price. Other pending offers on this listing (in other
        // conversations) are left as-is — a known gap, not auto-declined.
        if (accept) {
            Listing listing = conversation.getListing();
            listing.setStatus(Listing.ListingStatus.SOLD);
            listing.setPrice(message.getOfferAmount());
            listingRepository.save(listing);
        }

        return MessageResponse.from(message);
    }

    @Transactional
    public void markRead(Long conversationId, Long requestingUserId) {
        Conversation conversation = getConversationForParticipant(conversationId, requestingUserId);
        List<Message> unread = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream()
            .filter(m -> !m.getSender().getId().equals(requestingUserId) && !m.isReadByRecipient())
            .toList();
        unread.forEach(m -> m.setReadByRecipient(true));
        messageRepository.saveAll(unread);
    }

    private Conversation getConversationForParticipant(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        boolean isParticipant = conversation.getBuyer().getId().equals(userId)
            || conversation.getSeller().getId().equals(userId);
        if (!isParticipant) {
            throw new RuntimeException("Not authorised to access this conversation");
        }
        return conversation;
    }

    private ConversationResponse toResponse(Conversation conversation, Long viewerUserId) {
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        Message last = messages.isEmpty() ? null : messages.get(messages.size() - 1);
        long unread = messageRepository.countByConversationIdAndSenderIdNotAndReadByRecipientFalse(conversation.getId(), viewerUserId);

        Long otherUserId = conversation.getBuyer().getId().equals(viewerUserId)
            ? conversation.getSeller().getId()
            : conversation.getBuyer().getId();
        boolean hasEndorsedOther = userEndorsementRepository.existsByEndorserIdAndEndorsedId(viewerUserId, otherUserId);

        return ConversationResponse.from(conversation, viewerUserId, last, unread, hasEndorsedOther);
    }
}
