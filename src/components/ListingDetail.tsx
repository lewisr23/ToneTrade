import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetch(`${API}/api/listings/${listingId}/passport`)
      .then(res => res.json())
      .then(data => { setPassport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [listingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const body: any = { entryType: form.entryType, description: form.description };
    if (form.eventDate) body.eventDate = form.eventDate;

    const res = await fetch(`${API}/api/listings/${listingId}/passport/entries`, {
      method: 'POST',
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
      setShowForm(false);
    }
    setSubmitting(false);
  };

  if (loading) return <p style={{ color: '#888', fontSize: '14px' }}>Loading...</p>;

  return (
    <div style={{ marginTop: '32px', borderTop: '1px solid #333', paddingTop: '24px' }}>
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
              </div>
            </div>
          ))}
        </div>
      )}

      {isSeller && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{ marginTop: '8px', padding: '8px 16px', background: 'none', border: '1px solid #444', color: '#aaa', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
        >
          + Add entry
        </button>
      )}

      {isSeller && showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
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
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ padding: '8px 16px', background: 'none', border: '1px solid #444', color: '#aaa', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
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

  useEffect(() => {
    fetch(`${API}/api/listings/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => { setListing(data); setLoading(false); })
      .catch(() => { setError('Listing not found.'); setLoading(false); });
  }, [id]);

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
      }
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '24px' }}>Loading...</div>;
  if (error || !listing) return <div style={{ color: 'white', padding: '24px' }}>{error || 'Listing not found.'}</div>;

  const isSeller = user?.id === listing.sellerId;
  const isSold = listing.status === 'SOLD';

  return (
    <div style={{ padding: '24px', color: 'white', maxWidth: '600px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: '1px solid #444', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '24px' }}
      >
        Back
      </button>
      <p style={{ color: '#888', margin: 0 }}>{listing.category}</p>
      <h1 style={{ margin: '8px 0' }}>{listing.title}</h1>
      <h2 style={{ color: '#4caf50', margin: '0 0 16px' }}>
        £{listing.price}
        {isSold && (
          <span style={{ marginLeft: '12px', fontSize: '13px', fontWeight: 700, color: '#111', background: '#4caf50', padding: '3px 10px', borderRadius: '4px', verticalAlign: 'middle' }}>
            SOLD
          </span>
        )}
      </h2>
      <p style={{ color: '#aaa' }}>{listing.location}</p>
      <p style={{ color: '#aaa', fontSize: '14px' }}>
        Condition: {listing.condition} · Sold by {listing.sellerUsername}
        {listing.sellerVerified && <span style={{ color: '#4caf50', marginLeft: '8px' }}>Verified</span>}
      </p>
      <p style={{ lineHeight: '1.6' }}>{listing.description}</p>

      {!isSeller && !isSold && (
        <button
          onClick={handleMessageSeller}
          disabled={startingChat}
          style={{ marginTop: '16px', padding: '12px 24px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
        >
          {startingChat ? 'Starting chat...' : 'Message Seller'}
        </button>
      )}
      {!isSeller && isSold && (
        <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>This item has sold.</p>
      )}

      <PassportSection listingId={id!} isSeller={isSeller} />
    </div>
  );
}

export default ListingDetail;
