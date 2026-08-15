import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ListingCard from './ListingCard';

const API = 'http://localhost:8080';

interface SellerListing {
  id: number;
  title: string;
  price: number;
  location: string;
  category: string;
  status: string;
  imageUrls?: string[];
  audioUrls?: string[];
}

interface SellerProfileData {
  id: number;
  username: string;
  verified: boolean;
  location: string | null;
  bio: string | null;
  memberSince: string;
  endorsementCount: number;
  followerCount: number;
  followedByViewer: boolean;
  listings: SellerListing[];
}

function memberSinceLabel(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<SellerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/users/${id}/profile`, {
      // Sent even though the endpoint is public — if present and valid, the
      // backend uses it to fill in followedByViewer for the logged-in viewer.
      headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => { setError('Seller not found.'); setLoading(false); });
  }, [id, user?.token]);

  const handleToggleFollow = async () => {
    if (!user) { navigate('/login'); return; }
    if (!profile) return;
    setFollowBusy(true);
    try {
      const res = await fetch(`${API}/api/users/${id}/follow`, {
        method: profile.followedByViewer ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({ ...profile, followedByViewer: data.following, followerCount: data.followerCount });
      } else {
        let detail = `Server responded ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) detail = body.error;
        } catch {
          // response wasn't JSON -- stick with the status code
        }
        console.error('Failed to toggle follow:', detail);
        alert(`Couldn't update follow status: ${detail}`);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      alert('Could not reach the server. Is the backend running?');
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '24px' }}>Loading...</div>;
  if (error || !profile) return <div style={{ color: 'white', padding: '24px' }}>{error || 'Seller not found.'}</div>;

  const isOwnProfile = user?.id === profile.id;

  return (
    <div style={{ padding: '24px', color: 'white', maxWidth: '1300px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: '1px solid #444', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '24px' }}
      >
        Back
      </button>

      <div
        style={{
          background: '#161616',
          border: '1px solid #262626',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {profile.username}
              {profile.verified && (
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#4caf50' }}>✓ Verified</span>
              )}
            </h1>
            {profile.location && <p style={{ margin: '0 0 4px', color: '#aaa' }}>📍 {profile.location}</p>}
            <p style={{ margin: '0 0 12px', color: '#888', fontSize: '13px' }}>
              Member since {memberSinceLabel(profile.memberSince)} · {profile.endorsementCount} endorsement{profile.endorsementCount === 1 ? '' : 's'} · {profile.followerCount} follower{profile.followerCount === 1 ? '' : 's'}
            </p>
          </div>

          {!isOwnProfile && (
            <button
              onClick={handleToggleFollow}
              disabled={followBusy}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                flexShrink: 0,
                border: profile.followedByViewer ? '1px solid #444' : 'none',
                background: profile.followedByViewer ? 'none' : '#4caf50',
                color: profile.followedByViewer ? '#ccc' : 'white',
              }}
            >
              {followBusy ? '...' : profile.followedByViewer ? 'Following ✓' : '+ Follow'}
            </button>
          )}
        </div>
        {profile.bio && <p style={{ margin: '12px 0 0', lineHeight: '1.6', color: '#ddd' }}>{profile.bio}</p>}
      </div>

      <h2 style={{ fontSize: '18px', margin: '0 0 16px' }}>
        Listings from {profile.username}
      </h2>
      {profile.listings.length === 0 ? (
        <p style={{ color: '#888' }}>No listings yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {profile.listings.map(listing => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              price={listing.price}
              location={listing.location}
              category={listing.category}
              status={listing.status}
              imageUrl={listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[0] : null}
              audioUrls={listing.audioUrls}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerProfile;
