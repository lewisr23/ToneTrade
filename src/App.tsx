import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ListingDetail from './components/ListingDetail';
import ListingCard from './components/ListingCard';

const listings = [
  { id: 1, title: "Fender Stratocaster", price: 450, location: "London", category: "Guitar" },
  { id: 2, title: "Gibson Les Paul", price: 800, location: "Manchester", category: "Guitar" },
  { id: 3, title: "Roland TD-17", price: 300, location: "Newcastle", category: "Drums" },
  { id: 4, title: "Martin D-28", price: 1200, location: "Bristol", category: "Guitar" },
  { id: 5, title: "Shure SM-58", price: 65, location: "Newcastle", category: "Microphone" },
];

const categories = ["All", "Guitar", "Drums", "Microphone", "Synths", "Audio Equipment"];

function HomePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {filtered.map(listing => (
          <ListingCard key={listing.id} title={listing.title} price={listing.price} location={listing.location} category={listing.category} id={listing.id} />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;