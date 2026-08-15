import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { useAuth } from '../context/AuthContext';
import { createChatClient } from '../lib/socket';

const API = 'http://localhost:8080';

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderUsername: string;
  content: string;
  messageType: 'TEXT' | 'PRICE_OFFER';
  offerAmount: number | null;
  offerStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | null;
  createdAt: string;
}

interface ConversationSummary {
  id: number;
  listingId: number;
  listingTitle: string;
  listingPrice: number;
  listingImageUrl: string | null;
  otherUserId: number;
  otherUsername: string;
  otherVerified: boolean;
  viewerIsSeller: boolean;
  hasEndorsedOther: boolean;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

function ConversationRow({ conv, active, onClick }: { conv: ConversationSummary; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        background: active ? '#1a1a1a' : 'transparent',
        borderBottom: '1px solid #222',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
          {conv.otherUsername}
          {conv.otherVerified && <span style={{ color: '#4caf50', marginLeft: '6px', fontSize: '11px' }}>Verified</span>}
        </p>
        {conv.unreadCount > 0 && (
          <span style={{ background: '#4caf50', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px' }}>
            {conv.unreadCount}
          </span>
        )}
      </div>
      <p style={{ margin: '2px 0 0', color: '#888', fontSize: '12px' }}>{conv.listingTitle}</p>
      <p style={{ margin: '2px 0 0', color: '#666', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {conv.lastMessagePreview || 'No messages yet'}
      </p>
    </div>
  );
}

function ChatPanel({
  conversationId,
  conv,
  token,
  currentUserId,
  onActivity,
}: {
  conversationId: number;
  conv: ConversationSummary | undefined;
  token: string;
  currentUserId: number;
  onActivity: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [offerMode, setOfferMode] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [endorsing, setEndorsing] = useState(false);
  const [endorseError, setEndorseError] = useState('');
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const clientRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => { setMessages(data); setLoading(false); })
      .catch(() => setLoading(false));

    fetch(`${API}/api/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).then(onActivity).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, token]);

  useEffect(() => {
    const client = createChatClient(token);
    client.onConnect = () => {
      client.subscribe(`/topic/conversations/${conversationId}`, frame => {
        const msg: ChatMessage = JSON.parse(frame.body);
        setMessages(prev => {
          const exists = prev.some(m => m.id === msg.id);
          return exists ? prev.map(m => (m.id === msg.id ? msg : m)) : [...prev, msg];
        });
        onActivity();
      });
    };
    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const publish = (body: { content: string; messageType: 'TEXT' | 'PRICE_OFFER'; offerAmount?: number }) => {
    clientRef.current?.publish({
      destination: `/app/chat/${conversationId}/send`,
      body: JSON.stringify(body),
    });
  };

  const sendText = (text: string) => {
    if (!text.trim()) return;
    publish({ content: text.trim(), messageType: 'TEXT' });
    setDraft('');
  };

  const sendOffer = () => {
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) return;
    publish({ content: `Offer: £${amount}`, messageType: 'PRICE_OFFER', offerAmount: amount });
    setOfferAmount('');
    setOfferMode(false);
  };

  const respondToOffer = async (messageId: number, accept: boolean) => {
    setRespondingId(messageId);
    try {
      const res = await fetch(`${API}/api/conversations/${conversationId}/messages/${messageId}/${accept ? 'accept' : 'decline'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // This previously had no res.ok check and no catch at all -- any
        // failure (the offer already responded to, listing already sold,
        // network error) left the Accept/Decline buttons looking dead.
        let detail = `Server responded ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) detail = body.error;
        } catch {
          // response wasn't JSON -- stick with the status code
        }
        console.error('Failed to respond to offer:', detail);
        alert(`Couldn't ${accept ? 'accept' : 'decline'} this offer: ${detail}`);
      }
    } catch (err) {
      console.error('Failed to respond to offer:', err);
      alert('Could not reach the server. Is the backend running?');
    } finally {
      setRespondingId(null);
    }
  };

  const endorseOtherUser = async () => {
    if (!conv) return;
    setEndorsing(true);
    setEndorseError('');
    try {
      const res = await fetch(`${API}/api/users/${conv.otherUserId}/endorse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onActivity();
      } else {
        const body = await res.json().catch(() => null);
        setEndorseError(body?.error || 'Could not endorse this user.');
      }
    } catch (err) {
      // Only a raw network-level throw (backend down) was unhandled before --
      // the res.ok branch above already surfaced normal rejection reasons.
      console.error('Failed to endorse user:', err);
      setEndorseError('Could not reach the server. Is the backend running?');
    } finally {
      setEndorsing(false);
    }
  };

  const suggestions = conv
    ? [
        'Hi! Is this still available?',
        'Can you tell me more about its condition?',
        conv.listingPrice ? `Would you take £${Math.round(conv.listingPrice * 0.9)}?` : 'Would you consider a lower price?',
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {conv && (
        <div style={{ padding: '16px', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {conv.otherUsername}
                {conv.otherVerified && <span style={{ color: '#4caf50', marginLeft: '8px', fontSize: '13px' }}>Verified</span>}
              </p>
              <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>
                {conv.listingTitle} · £{conv.listingPrice}
              </p>
            </div>
            {conv.hasEndorsedOther ? (
              <span style={{ fontSize: '12px', color: '#4caf50', whiteSpace: 'nowrap' }}>Endorsed ✓</span>
            ) : (
              <button
                onClick={endorseOtherUser}
                disabled={endorsing}
                style={{ padding: '6px 12px', background: 'none', color: '#4caf50', border: '1px solid #4caf50', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
              >
                {endorsing ? 'Endorsing...' : `Endorse ${conv.otherUsername}`}
              </button>
            )}
          </div>
          {endorseError && <p style={{ margin: '6px 0 0', color: '#f44', fontSize: '12px' }}>{endorseError}</p>}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading && <p style={{ color: '#888' }}>Loading...</p>}

        {!loading && messages.length === 0 && (
          <div style={{ color: '#888' }}>
            <p style={{ fontSize: '14px' }}>No messages yet. Try one of these:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '360px' }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendText(s)}
                  style={{ textAlign: 'left', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #444', color: '#ccc', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => {
          const mine = m.senderId === currentUserId;
          const isOffer = m.messageType === 'PRICE_OFFER';
          return (
            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
              <div
                style={{
                  background: isOffer ? '#2e4d2e' : mine ? '#4caf50' : '#1a1a1a',
                  border: isOffer ? '1px solid #4caf50' : mine ? 'none' : '1px solid #333',
                  color: mine && !isOffer ? '#111' : 'white',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '14px',
                }}
              >
                {isOffer && (
                  <>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#4caf50' }}>Offer: £{m.offerAmount}</p>
                    <p style={{ margin: 0 }}>{m.content}</p>

                    {m.offerStatus === 'PENDING' && !mine && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <button
                          onClick={() => respondToOffer(m.id, true)}
                          disabled={respondingId === m.id}
                          style={{ padding: '4px 10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {respondingId === m.id ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => respondToOffer(m.id, false)}
                          disabled={respondingId === m.id}
                          style={{ padding: '4px 10px', background: 'none', color: '#f44', border: '1px solid #f44', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {respondingId === m.id ? '...' : 'Decline'}
                        </button>
                      </div>
                    )}
                    {m.offerStatus === 'PENDING' && mine && (
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#aaa' }}>Awaiting response...</p>
                    )}
                    {m.offerStatus === 'ACCEPTED' && (
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#4caf50', fontWeight: 600 }}>Accepted</p>
                    )}
                    {m.offerStatus === 'DECLINED' && (
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#f44', fontWeight: 600 }}>Declined</p>
                    )}
                  </>
                )}
                {!isOffer && <p style={{ margin: 0 }}>{m.content}</p>}
              </div>
              <p style={{ margin: '2px 4px 0', fontSize: '11px', color: '#666', textAlign: mine ? 'right' : 'left' }}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: '1px solid #333', padding: '12px 16px' }}>
        {offerMode ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ alignSelf: 'center', color: '#888' }}>£</span>
            <input
              type="number"
              autoFocus
              value={offerAmount}
              onChange={e => setOfferAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOffer()}
              style={{ flex: 1, padding: '10px', background: '#1a1a1a', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
            />
            <button onClick={sendOffer} style={{ padding: '10px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Send offer
            </button>
            <button onClick={() => setOfferMode(false)} style={{ padding: '10px 16px', background: 'none', color: '#aaa', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendText(draft)}
              style={{ flex: 1, padding: '10px', background: '#1a1a1a', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
            />
            {!conv?.viewerIsSeller && (
              <button onClick={() => setOfferMode(true)} style={{ padding: '10px 16px', background: 'none', color: '#4caf50', border: '1px solid #4caf50', borderRadius: '4px', cursor: 'pointer' }}>
                Make offer
              </button>
            )}
            <button onClick={() => sendText(draft)} style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MessagesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = () => {
    if (!user) return;
    fetch(`${API}/api/conversations`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(res => res.json())
      .then(data => { setConversations(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return <div style={{ color: 'white', padding: '24px' }}>Log in to view your messages.</div>;
  }

  const activeId = id ? Number(id) : null;
  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 90px)', color: 'white' }}>
      <div style={{ width: '320px', borderRight: '1px solid #333', overflowY: 'auto', flexShrink: 0 }}>
        <h2 style={{ padding: '16px', margin: 0, fontSize: '18px' }}>Messages</h2>
        {loading && <p style={{ color: '#888', padding: '0 16px' }}>Loading...</p>}
        {!loading && conversations.length === 0 && (
          <p style={{ color: '#666', padding: '0 16px', fontSize: '14px' }}>No conversations yet. Message a seller from a listing to start one.</p>
        )}
        {conversations.map(c => (
          <ConversationRow key={c.id} conv={c} active={c.id === activeId} onClick={() => navigate(`/messages/${c.id}`)} />
        ))}
      </div>
      <div style={{ flex: 1 }}>
        {activeId ? (
          <ChatPanel conversationId={activeId} conv={activeConv} token={user.token} currentUserId={user.id} onActivity={fetchConversations} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;
