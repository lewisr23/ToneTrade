import { useState } from 'react';
import Navbar from './components/Navbar';
import ListingCard from './components/ListingCard';

const listings = [
  { id: 1, title: "Fender Stratocaster", price: 450, location: "London" },
  { id: 2, title: "Gibson Les Paul", price: 800, location: "Manchester" },
  { id: 3, title: "Roland TD-17", price: 300, location: "Newcastle" },
  { id: 4, title: "Martin D-28", price: 1200, location: "Bristol" },
  { id: 5, title: "Shure SM-58", price: 65, location: "Newcastle" },
];

function App() {
  const [search, setSearch] = useState('');

  const filtered = listings.filter(listing =>
    listing.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Navbar />
      <div style={{ padding: '24px' }}>
        <input
          type="text"
          placeholder="Search instruments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px', width: '300px', marginBottom: '24px' }}
        />
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {filtered.map(listing => (
            <ListingCard key={listing.id} title={listing.title} price={listing.price} location={listing.location} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;