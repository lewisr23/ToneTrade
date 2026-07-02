package com.tonetrade.dto;

import com.tonetrade.entity.Conversation;
import com.tonetrade.entity.ListingMedia;
import com.tonetrade.entity.Message;
import com.tonetrade.entity.User;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ConversationResponse {

    private Long id;
    private Long listingId;
    private String listingTitle;
    private BigDecimal listingPrice;
    private String listingImageUrl;

    // The other participant, relative to whoever is viewing this response
    private Long otherUserId;
    private String otherUsername;
    private boolean otherVerified;

    // True if the viewer is the seller on this listing — used by the client to
    // hide "make offer" for sellers (only buyers propose a price).
    private boolean viewerIsSeller;

    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;
    private long unreadCount;

    public static ConversationResponse from(Conversation conversation, Long viewerUserId, Message lastMessage, long unreadCount) {
        ConversationResponse r = new ConversationResponse();
        r.setId(conversation.getId());
        r.setListingId(conversation.getListing().getId());
        r.setListingTitle(conversation.getListing().getTitle());
        r.setListingPrice(conversation.getListing().getPrice());

        if (conversation.getListing().getMedia() != null) {
            r.setListingImageUrl(conversation.getListing().getMedia().stream()
                .filter(m -> m.getMediaType() == ListingMedia.MediaType.IMAGE)
                .map(ListingMedia::getUrl)
                .findFirst()
                .orElse(null));
        }

        User other = conversation.getBuyer().getId().equals(viewerUserId)
            ? conversation.getSeller()
            : conversation.getBuyer();
        r.setOtherUserId(other.getId());
        r.setOtherUsername(other.getUsername());
        r.setOtherVerified(other.isVerified());
        r.setViewerIsSeller(conversation.getSeller().getId().equals(viewerUserId));

        r.setLastMessagePreview(lastMessage != null ? lastMessage.getContent() : null);
        r.setLastMessageAt(conversation.getLastMessageAt());
        r.setUnreadCount(unreadCount);

        return r;
    }
}
