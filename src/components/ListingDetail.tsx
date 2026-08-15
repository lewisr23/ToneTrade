import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8080';

interface PassportEntry {
  id: number;
  entryType: string;
  description: string;
  eventDate: string | null;
  createdAt: string;
}

interface Passport {
  id: number;
  serialNumber: string | null;
  yearManufactured: number | null;
  entries: PassportEntry[];
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
  ORIGINAL_PURCHASE: 'Original Purchase',
  OWNERSHIP_CHANGE: 'Ownership Change',
  SERVICE: 'Service',
  REPAIR: 'Repair',
  MODIFICATION: 'Modification',
  OTHER: 'Other',
};

function PassportSection({ listingId, isSeller }: { listingId: string; isSeller: boolean }) {
  const { user } = useAuth();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ entryType: 'ORIGINAL_PURCHASE', description: '', eventDate: '' });
  // null = adding a new entry; set = editing an existing one in place (added
  // after a real typo made it into a logged entry with no way to fix it --
  // entries used to be add-only).
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/api/listings/${listingId}/passport`)
      .then(res => res.json())
      .then(data => { setPassport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [listingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: any = { entryType: form.entryType, description: form.description };
      if (form.eventDate) body.eventDate = form.eventDate;

      const url = editingEntryId
        ? `${API}/api/listings/${listingId}/passport/entries/${editingEntryId}`
        : `${API}/api/listings/${listingId}/passport/entries`;

      const res = await fetch(url, {
        method: editingEntryId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const updated = await res.json();
        setPassport(updated);
        setForm({ entryType: 'ORIGINAL_PURCHASE', description: '', eventDate: '' });
        setEditingEntryId(null);
        setShowForm(false);
      } else {
        let detail = `Server responded ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody?.error) detail = errBody.error;
        } catch {
          // response wasn't JSON -- stick with the status code
        }
        console.error('Failed to save gear history entry:', detail);
        alert(`Couldn't save this entry: ${detail}`);
      }
    } catch (err) {
      // This function previously had no try/catch at all -- a network
      // failure here would throw, skip the reset below entirely, and leave
      // the button permanently stuck on "Saving...".
      console.error('Failed to save gear history entry:', err);
      alert('Could not reach the server. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ color: '#888', fontSize: '14px' }}>Loading...</p>;

  return (
    <div style={{ borderTop: '1px solid #333', paddingTop: '24px', marginTop: '32px' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '18px' }}>Gear History</h3>

      {passport?.serialNumber && (
        <p style={{ color: '#888', fontSize: '13px', margin: '4px 0' }}>
          Serial: {passport.serialNumber}
          {passport.yearManufactured && ` · Made: ${passport.yearManufactured}`}
        </p>
      )}

      {passport?.entries.length === 0 ? (
        <p style={{ color: '#666', fontSize: '14px', margin: '16px 0' }}>No history entries yet.</p>
      ) : (
        <div style={{ marginTop: '16px' }}>
          {passport?.entries.map((entry, i) => (
            <div key={entry.id} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4caf50', flexShrink: 0, marginTop: '4px' }} />
                {i < (passport?.entries.length ?? 0) - 1 && (
                  <div style={{ width: '2px', flex: 1, background: '#333', marginTop: '4px' }} />
                )}
              </div>
              <div style={{ paddingBottom: '8px' }}>
                <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#4caf50', fontWeight: 600 }}>
                  {ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
                  {entry.eventDate && <span style={{ color: '#888', fontWeight: 400 }}> · {entry.eventDate}</span>}
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#ccc', lineHeight: '1.5' }}>{entry.description}</p>
                {isSeller && !(showForm && editingEntryId === entry.id) && (
                  <button
                    onClick={() => {
                      setForm({
                        entryType: entry.entryType,
                        description: entry.description,
                        eventDate: entry.eventDate ?? '',
                      });
                      setEditingEntryId(entry.id);
                      setShowForm(true);
                    }}
                    style={{ marginTop: '4px', padding: '2px 8px', background: 'none', border: '1px solid #333', color: '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSeller && !showForm && (
        <button
          onClick={() => {
            setForm({ entryType: 'ORIGINAL_PURCHASE', description: '', eventDate: '' });
            setEditingEntryId(null);
            setShowForm(true);
          }}
          style={{ marginTop: '8px', padding: '8px 16px', background: 'none', border: '1px solid #444', color: '#aaa', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
        >
          + Add entry
        </button>
      )}

      {isSeller && showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
            {editingEntryId ? 'Editing entry' : 'New entry'}
          </p>
          <select
            value={form.entryType}
            onChange={e => setForm({ ...form, entryType: e.target.value })}
            style={{ padding: '8px', background: '#1a1a1a', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
          >
            {Object.entries(ENTRY_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            required
            rows={3}
            style={{ padding: '8px', background: '#1a1a1a', border: '1px solid #444', color: 'white', borderRadius: '4px', resize: 'vertical' }}
          />
          <input
            type="date"
            value={form.eventDate}
            onChange={e => setForm({ ...form, eventDate: e.target.value })}
            style={{ padding: '8px', background: '#1a1a1a', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={submitting}
              style={{ padding: '8px 16px', background: '#4caf50', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
              {submitting ? 'Saving...' : editingEntryId ? 'Save changes' : 'Save'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingEntryId(null); }}
              style={{ padding: '8px 16px', background: 'none', border: '1px solid #444', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function mediaUrl(url: string) {
  // Backend returns relative paths like "/uploads/xyz.jpg" — same convention
  // images/audio/video all use, so one helper covers all three.
  return url.startsWith('http') ? url : `${API}${url}`;
}

function formatCategory(cat: string) {
  return cat
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Small rounded pill used for the location/condition/seller meta info —
// modelled loosely on Reverb's listing-page tags/seller box, kept in our own
// dark/grey palette rather than their light theme (Lewis explicitly wants to
// keep the dark colours, just borrow the layout pattern).
function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '999px',
        background: '#1a1a1a',
        border: '1px solid #333',
        fontSize: '13px',
        color: '#ccc',
      }}
    >
      {children}
    </span>
  );
}

// Rough good-to-poor colour scale for the condition dot in its chip.
const CONDITION_COLORS: Record<string, string> = {
  MINT: '#4caf50',
  EXCELLENT: '#8bc34a',
  GOOD: '#cddc39',
  FAIR: '#ff9800',
  POOR: '#f44336',
};

// Fair price indicator (proposal objective 8) — reads the pricing-context
// fields the backend attaches to the single-listing response
// (ListingService.applyPriceContext) and renders them as a small badge next
// to the price. Purely presentational: all the actual comparison logic
// (thresholds, sample-size gate) lives server-side so there's one source of
// truth for what "fair" means.
const PRICE_ASSESSMENT_STYLES: Record<string, { label: string; color: string; background: string }> = {
  BELOW_AVERAGE: { label: 'Below average', color: '#4caf50', background: 'rgba(76, 175, 80, 0.12)' },
  TYPICAL: { label: 'Fair price', color: '#8bc34a', background: 'rgba(139, 195, 74, 0.12)' },
  ABOVE_AVERAGE: { label: 'Above average', color: '#ff9800', background: 'rgba(255, 152, 0, 0.12)' },
};

function PriceContext({ listing }: { listing: any }) {
  const assessment = listing.priceAssessment;
  if (!assessment || assessment === 'INSUFFICIENT_DATA') return null;

  const style = PRICE_ASSESSMENT_STYLES[assessment];
  if (!style) return null;

  const categoryLabel = formatCategory(listing.category);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '4px',
        marginBottom: '12px',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '13px',
        color: style.color,
        background: style.background,
      }}
      title={`Average ${categoryLabel} listing price: £${listing.categoryAveragePrice} (based on ${listing.categorySampleSize} listings)`}
    >
      {style.label} for {categoryLabel} · avg £{listing.categoryAveragePrice}
    </div>
  );
}

// Supplementary model-specific reference price (see ListingService.MODEL_REFERENCE_PRICES
// on the backend) — only rendered when the listing title matched a recognised model.
function ReferencePrice({ listing }: { listing: any }) {
  if (!listing.referenceModelName) return null;

  return (
    <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px' }}>
      Typical resale for {listing.referenceModelName}: ~£{listing.referenceModelPrice}{' '}
      <span style={{ color: '#666' }}>(rough estimate, not live market data)</span>
    </p>
  );
}

type MediaItem = { type: 'image' | 'video' | 'audio'; url: string };

function buildMediaItems(listing: any): MediaItem[] {
  const images: string[] = listing.imageUrls || [];
  const videos: string[] = listing.videoUrls || [];
  const audio: string[] = listing.audioUrls || [];
  return [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...videos.map(url => ({ type: 'video' as const, url })),
    ...audio.map(url => ({ type: 'audio' as const, url })),
  ];
}

function MediaThumb({ item, active, onClick }: { item: MediaItem; active: boolean; onClick: () => void }) {
  const baseStyle: React.CSSProperties = {
    width: '64px',
    height: '64px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: active ? '2px solid #4caf50' : '1px solid #333',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a1a',
    color: '#888',
    fontSize: '20px',
    overflow: 'hidden',
  };

  if (item.type === 'image') {
    return (
      <img
        src={mediaUrl(item.url)}
        alt=""
        onClick={onClick}
        style={{ ...baseStyle, objectFit: 'cover' }}
      />
    );
  }

  return (
    <div onClick={onClick} style={baseStyle}>
      {item.type === 'video' ? '▶' : '♪'}
    </div>
  );
}

// Placeholder used when a listing has no media at all, so the dominant left
// column of the Reverb-style layout doesn't collapse to nothing.
function NoMediaPlaceholder() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '4 / 3',
        borderRadius: '8px',
        border: '1px solid #333',
        background: '#161616',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#555',
        fontSize: '14px',
      }}
    >
      No photos yet
    </div>
  );
}

// Single swipeable/scrollable media gallery covering photos, video, and audio
// together (eBay/Reverb-style) rather than three separately-headed, separately
// spaced blocks. One shared main display + one shared thumbnail strip; the
// type of the active item decides what renders in the main display. Touch
// swipe is hand-rolled (no carousel library — avoids an npm install against
// this repo, see the standing npm-install warning) alongside click-driven
// prev/next arrows and thumbnails for desktop/mouse use.
function MediaSection({ listing }: { listing: any }) {
  const items = buildMediaItems(listing);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (items.length === 0) return <NoMediaPlaceholder />;

  const active = items[activeIndex];

  const goTo = (i: number) => {
    setActiveIndex((i + items.length) % items.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      goTo(activeIndex + (delta < 0 ? 1 : -1));
    }
    touchStartX.current = null;
  };

  return (
    <div>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '8px',
          border: '1px solid #333',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111',
        }}
      >
        {active.type === 'image' && (
          <img
            src={mediaUrl(active.url)}
            alt={listing.title}
            style={{ width: '100%', maxHeight: '460px', objectFit: 'cover' }}
          />
        )}
        {active.type === 'video' && (
          <video key={active.url} controls style={{ width: '100%', maxHeight: '460px' }}>
            <source src={mediaUrl(active.url)} />
          </video>
        )}
        {active.type === 'audio' && (
          <div style={{ width: '100%', padding: '32px 24px' }}>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 12px', textAlign: 'center' }}>Audio demo</p>
            <audio key={active.url} controls style={{ width: '100%' }}>
              <source src={mediaUrl(active.url)} />
            </audio>
          </div>
        )}

        {items.length > 1 && (
          <>
            <button
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous"
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
            >
              ‹
            </button>
            <button
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next"
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', overflowX: 'auto' }}>
          {items.map((item, i) => (
            <MediaThumb key={item.url + i} item={item} active={i === activeIndex} onClick={() => goTo(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

// Right-hand "purchase panel" — title, condition, price, price context,
// seller info, and the primary action button. Modelled on Reverb's listing
// page layout (title/tag/price/CTA/seller box stacked in a compact column
// next to a dominant image), kept in our existing dark/grey palette rather
// than adopting their light theme + orange accent.
function PurchasePanel({
  listing,
  isSeller,
  isSold,
  isLoggedIn,
  startingChat,
  saveBusy,
  onMessageSeller,
  onToggleSave,
  onBuyNow,
}: {
  listing: any;
  isSeller: boolean;
  isSold: boolean;
  isLoggedIn: boolean;
  startingChat: boolean;
  saveBusy: boolean;
  onMessageSeller: () => void;
  onToggleSave: () => void;
  onBuyNow: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <p style={{ color: '#888', margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {formatCategory(listing.category)}
        </p>
        {isSeller && (
          <button
            onClick={() => navigate(`/listing/${listing.id}/edit`)}
            style={{ background: 'none', border: '1px solid #444', color: '#aaa', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}
          >
            Edit listing
          </button>
        )}
      </div>
      <h1 style={{ margin: '8px 0', fontSize: '24px' }}>{listing.title}</h1>

      <MetaChip>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: CONDITION_COLORS[listing.condition] || '#888',
            display: 'inline-block',
          }}
        />
        {formatCategory(listing.condition)}
      </MetaChip>

      <h2 style={{ color: '#4caf50', margin: '16px 0 0', fontSize: '28px' }}>
        £{listing.price}
        {isSold && (
          <span style={{ marginLeft: '12px', fontSize: '13px', fontWeight: 700, color: '#111', background: '#4caf50', padding: '3px 10px', borderRadius: '4px', verticalAlign: 'middle' }}>
            SOLD
          </span>
        )}
      </h2>
      <div>
        <PriceContext listing={listing} />
      </div>
      <ReferencePrice listing={listing} />

      {!isSeller && !isSold && (
        <button
          className="btn-primary"
          onClick={onBuyNow}
          style={{ width: '100%', marginTop: '16px', padding: '14px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
        >
          {`Buy Now — £${listing.price}`}
        </button>
      )}
      {!isSeller && !isSold && (
        <button
          onClick={onMessageSeller}
          disabled={startingChat}
          style={{ width: '100%', marginTop: '8px', padding: '12px 24px', background: 'none', color: '#ccc', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
        >
          {startingChat ? 'Starting chat...' : 'Message Seller instead'}
        </button>
      )}
      {!isSeller && isSold && (
        <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>This item has sold.</p>
      )}

      {!isSeller && (
        <button
          onClick={onToggleSave}
          disabled={saveBusy}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '12px 24px',
            background: 'none',
            color: listing.savedByViewer ? '#4caf50' : '#ccc',
            border: listing.savedByViewer ? '1px solid #4caf50' : '1px solid #444',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {saveBusy ? '...' : listing.savedByViewer ? '★ Saved' : '☆ Save for later'}
        </button>
      )}

      <div
        onClick={() => navigate(`/seller/${listing.sellerId}`)}
        style={{
          marginTop: '20px',
          padding: '16px',
          border: '1px solid #262626',
          borderRadius: '8px',
          background: '#161616',
          cursor: 'pointer',
        }}
      >
        <p style={{ margin: 0, fontSize: '14px', color: '#ddd' }}>
          Sold by <strong>{listing.sellerUsername}</strong>
          {listing.sellerVerified && (
            <span style={{ color: '#4caf50', fontWeight: 700, marginLeft: '8px' }}>✓ Verified</span>
          )}
          <span style={{ color: '#666', marginLeft: '8px', fontSize: '13px' }}>View profile ›</span>
        </p>
        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#888' }}>📍 {listing.location}</p>
      </div>
    </div>
  );
}

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/listings/${id}`, {
      headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => { setListing(data); setLoading(false); })
      .catch(() => { setError('Listing not found.'); setLoading(false); });
  }, [id, user?.token]);

  const handleMessageSeller = async () => {
    if (!user) { navigate('/login'); return; }
    setStartingChat(true);
    try {
      const res = await fetch(`${API}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ listingId: Number(id) }),
      });
      if (res.ok) {
        const conv = await res.json();
        navigate(`/messages/${conv.id}`);
      } else {
        // Surface the actual failure instead of doing nothing. This branch
        // used to fall through silently on any non-2xx response (e.g. the
        // backend rejecting the request) -- exactly why the button looked
        // like it did nothing when something went wrong.
        let detail = `Server responded ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) detail = body.error;
        } catch {
          // response wasn't JSON -- stick with the status code
        }
        console.error('Failed to start conversation:', detail);
        alert(`Couldn't open the chat: ${detail}`);
      }
    } catch (err) {
      // Network-level failure (backend not running, CORS, etc.) was
      // completely unhandled before -- there was no catch at all, so any
      // thrown error just silently reset the button via finally.
      console.error('Failed to start conversation:', err);
      alert('Could not reach the server. Is the backend running?');
    } finally {
      setStartingChat(false);
    }
  };

  // Buy Now goes through the checkout page (order summary + collection/
  // delivery choice) rather than firing the purchase directly from here —
  // the actual POST /buy happens on the Checkout page's confirm step.
  const handleBuyNow = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/checkout/${id}`);
  };

  const handleToggleSave = async () => {
    if (!user) { navigate('/login'); return; }
    if (!listing) return;
    setSaveBusy(true);
    try {
      const res = await fetch(`${API}/api/listings/${id}/save`, {
        method: listing.savedByViewer ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        setListing({ ...listing, savedByViewer: !listing.savedByViewer });
      } else {
        let detail = `Server responded ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) detail = body.error;
        } catch {
          // response wasn't JSON -- stick with the status code
        }
        console.error('Failed to toggle saved listing:', detail);
        alert(`Couldn't update saved status: ${detail}`);
      }
    } catch (err) {
      console.error('Failed to toggle saved listing:', err);
      alert('Could not reach the server. Is the backend running?');
    } finally {
      setSaveBusy(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '24px' }}>Loading...</div>;
  if (error || !listing) return <div style={{ color: 'white', padding: '24px' }}>{error || 'Listing not found.'}</div>;

  const isSeller = user?.id === listing.sellerId;
  const isSold = listing.status === 'SOLD';

  return (
    <div style={{ padding: '24px', color: 'white', maxWidth: '1100px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: '1px solid #444', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '24px' }}
      >
        Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 380px', gap: '40px', alignItems: 'start' }}>
        <MediaSection listing={listing} />
        <PurchasePanel
          listing={listing}
          isSeller={isSeller}
          isSold={isSold}
          isLoggedIn={!!user}
          startingChat={startingChat}
          saveBusy={saveBusy}
          onMessageSeller={handleMessageSeller}
          onToggleSave={handleToggleSave}
          onBuyNow={handleBuyNow}
        />
      </div>

      <div
        style={{
          background: '#161616',
          border: '1px solid #262626',
          borderRadius: '8px',
          padding: '16px',
          margin: '32px 0 0',
        }}
      >
        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Description
        </p>
        <p style={{ margin: 0, lineHeight: '1.6', color: '#ddd' }}>{listing.description}</p>
      </div>

      <PassportSection listingId={id!} isSeller={isSeller} />
    </div>
  );
}

export default ListingDetail;
