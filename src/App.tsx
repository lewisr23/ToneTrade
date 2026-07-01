import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ListingDetail from './components/ListingDetail';
import ListingCard from './components/ListingCard';
import CreateListing from './components/CreateListing';
import Login from './components/Login';
import Register from './components/Register';

const API = 'http://localhost:8080';

const categories = ["All", "Guitar", "Drums", "Microphone", "Synths", "Audio Equipment"];

const categoryToEnum: Record<string, string> = {
  "Guitar": "GUITAR",
  "Drums": "DRUMS",
  "Microphone": "MICROPHONE",
  "Synths": "SYNTHS",
  "Audio Equipment": "AUDIO_EQUIPMENT",
};

function HomePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCategory !== 'All') params.set('category', categoryToEnum[selectedCategory]);

    setLoading(true);
    fetch(`${API}/api/listings?${params}`)
      .then(res => res.json())
      .then(data => { setListings(data); setLoading(false); })
      .catch(() => { setError('Could not connect to backend.'); setLoading(false); });
  }, [search, selectedCategory]);

  return (
    <div style={{ padding: '24px' }}>
      <input
        type="text"
        placeholder="Search instruments..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ padding: '8px', width: '300px', marginBottom: '16px', display: 'block', background: '#1a1a1a', color: 'white', border: '1px solid #444' }}
      />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 16px',
              background: selectedCategory === cat ? 'white' : '#333',
              color: selectedCategory === cat ? 'black' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      {loading && <p style={{ color: '#888' }}>Loading...</p>}
      {error && <p style={{ color: '#f44' }}>{error}</p>}
      {!loading && !error && listings.length === 0 && (
        <p style={{ color: '#888' }}>No listings yet.</p>
      )}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {listings.map(listing => (
          <ListingCard
            key={listing.id}
            id={listing.id}
            title={listing.title}
            price={listing.price}
            location={listing.location}
            category={listing.category}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/create" element={<CreateListing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
