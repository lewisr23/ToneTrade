import { useState } from 'react';

const listings = [
  { id: 1, title: "Fender Stratocaster", price: 450, location: "London" },
  { id: 2, title: "Gibson Les Paul", price: 800, location: "Manchester" },
  { id: 3, title: "Roland TD-17", price: 300, location: "Newcastle" },
  { id: 4, title: "Martin D-28", price: 1200, location: "Bristol" },
  { id: 5, title: "Shure SM-58", price: 65, location: "Newcastle" },
];

function Navbar() {
  return (
    <nav style={{ background: '#1a1a1a', padding: '16px', color: 'white' }}>
      <h1 style={{ margin: 0 }}>ToneTrade</h1>
      <p style={{ margin: 0, fontSize: '14px' }}>UK Based Second-hand Instrument & Music Gear Marketplace </p>
    </nav>
  );
}

function ListingCard({ title, price, location }: { title: string, price: number, location: string }) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', width: '200px' }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p>£{price}</p>
      <p>{location}</p>
    </div>
  );
}

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
          placeholder="Browse our wares"
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