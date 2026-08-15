import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8080';

// Checkout page for the direct Buy Now flow. Deliberately does NOT process
// real payment — ToneTrade is peer-to-peer (like Gumtree/Facebook
// Marketplace): the platform records the sale and the buyer and seller
// arrange payment and collection/delivery between themselves via the
// existing messaging feature. This is a documented scope decision (same
// pattern as local-disk media storage and the hardcoded price reference
// table), not a missing feature: real card processing would need a payment
// processor integration, live card-data compliance, and webhook handling —
// out of proportion for a dissertation prototype.
function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(false);
  const [purchased, setPurchased] = useState(false);
  // Collection preference is cosmetic context for the seller conversation —
  // it isn't persisted server-side (no order entity exists; the listing
  // simply becomes SOLD).
  const [method, setMethod] = useState<'collection' | 'delivery'>('collection');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetch(`${API}/api/listings/${id}`, {
      headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => { setListing(data); setLoading(false); })
      .catch(() => { setError('Listing not found.'); setLoading(false); });
  }, [id, user, navigate]);

  const handleConfirm = async () => {
    if (!user || !listing) return;
    setBuying(true);
    try {
      const res = await fetch(`${API}/api/listings/${id}/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setListing(updated);
        setPurchased(true);
      } else {
        let detail = `Server responded ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) detail = body.error;
        } catch {
          // response wasn't JSON -- stick with the status code
        }
        alert(`Couldn't complete the purchase: ${detail}`);
      }
    } catch {
      alert('Could not reach the server. Is the backend running?');
    } finally {
      setBuying(false);
    }
  };

  const openChatWithSeller = async () => {
    if (!user) return;
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
        return;
      }
    } catch {
      // fall through to generic messages page
    }
    // The backend refuses new conversations on a SOLD listing, so if the
    // buyer didn't already have a conversation open, just take them to
    // their inbox rather than dead-ending.
    navigate('/messages');
  };

  if (loading) return <div style={{ color: 'white', padding: '24px' }}>Loading...</div>;
  if (error || !listing) return <div style={{ color: 'white', padding: '24px' }}>{error || 'Listing not found.'}</div>;

  const imageUrl = listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[0] : null;
  const imgSrc = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${API}${imageUrl}`) : null;
  const isSeller = user?.id === listing.sellerId;
  const isSold = listing.status === 'SOLD';

  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
  };

  // Already sold and we didn't just buy it here — dead end politely.
  if (isSold && !purchased) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px', color: 'white' }}>
        <div style={panelStyle}>
          <h1 style={{ margin: '0 0 8px', fontSize: '22px' }}>This listing has already sold</h1>
          <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Someone got there first — {listing.title} is no longer available.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate('/')}
            style={{ padding: '12px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
          >
            Browse more gear
          </button>
        </div>
      </div>
    );
  }

  if (isSeller) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px', color: 'white' }}>
        <div style={panelStyle}>
          <h1 style={{ margin: '0 0 8px', fontSize: '22px' }}>This is your own listing</h1>
          <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: '14px' }}>
            You can't buy gear you're selling.
          </p>
          <button
            className="btn-ghost"
            onClick={() => navigate(`/listing/${id}`)}
            style={{ padding: '12px 24px', background: 'none', color: '#ccc', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
          >
            Back to listing
          </button>
        </div>
      </div>
    );
  }

  if (purchased) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px', color: 'white' }}>
        <div style={{ ...panelStyle, textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '48px' }}>✅</div>
          <h1 style={{ margin: '16px 0 8px', fontSize: '24px' }}>Purchase confirmed</h1>
          <p style={{ margin: '0 auto 8px', color: 'var(--text-muted)', fontSize: '15px', maxWidth: '400px', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>{listing.title}</strong> is yours for{' '}
            <strong style={{ color: 'var(--accent)' }}>£{listing.price}</strong>.
          </p>
          <p style={{ margin: '0 auto 24px', color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', lineHeight: 1.6 }}>
            Message {listing.sellerUsername} to arrange payment and{' '}
            {method === 'collection' ? 'collection' : 'delivery'} — ToneTrade doesn't hold
            funds or process payment.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={openChatWithSeller}
              style={{ padding: '12px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
            >
              Message {listing.sellerUsername}
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate('/')}
              style={{ padding: '12px 24px', background: 'none', color: '#ccc', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
            >
              Back to browsing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px', color: 'white' }}>
      <button
        onClick={() => navigate(`/listing/${id}`)}
        style={{ background: 'none', border: '1px solid #444', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '24px' }}
      >
        Back to listing
      </button>

      <h1 style={{ margin: '0 0 24px', fontSize: '26px', letterSpacing: '-0.01em' }}>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        <div style={panelStyle}>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            How you'll get it
          </h2>
          {([
            { key: 'collection', title: 'Collect in person', desc: `Meet the seller and pick it up — they're in ${listing.location}. You can inspect the gear before handing anything over.` },
            { key: 'delivery', title: 'Arrange delivery', desc: 'Agree postage or a courier with the seller in chat. Check the gear on arrival.' },
          ] as const).map(opt => (
            <label
              key={opt.key}
              style={{
                display: 'block',
                padding: '14px 16px',
                marginBottom: '10px',
                background: method === opt.key ? '#1d2b1d' : 'var(--bg-raised)',
                border: method === opt.key ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="method"
                checked={method === opt.key}
                onChange={() => setMethod(opt.key)}
                style={{ marginRight: '10px' }}
              />
              <strong style={{ fontSize: '14px' }}>{opt.title}</strong>
              <p style={{ margin: '6px 0 0 24px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{opt.desc}</p>
            </label>
          ))}

          <div style={{ marginTop: '20px', padding: '14px 16px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Payment is arranged directly with the seller.</strong>{' '}
              ToneTrade doesn't hold funds or take a cut — confirming reserves the
              listing for you and marks it sold, then you settle up in person or
              however you both agree in chat.
            </p>
          </div>
        </div>

        <div style={panelStyle}>
          {imgSrc ? (
            <img src={imgSrc} alt={listing.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px', marginBottom: '14px' }} />
          ) : null}
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sold by {listing.sellerUsername}
            {listing.sellerVerified && <span style={{ color: 'var(--accent)', marginLeft: '6px' }}>✓ Verified</span>}
          </p>
          <h2 style={{ margin: '0 0 12px', fontSize: '17px', lineHeight: 1.35 }}>{listing.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Item price</span>
            <span style={{ fontSize: '14px' }}>£{listing.price}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>£{listing.price}</span>
          </div>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={buying}
            style={{ width: '100%', padding: '14px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}
          >
            {buying ? 'Confirming...' : 'Confirm purchase'}
          </button>
          <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--text-faint)', textAlign: 'center' }}>
            This can't be undone — the listing is marked sold immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
