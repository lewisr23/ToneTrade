import { useParams, useNavigate } from 'react-router-dom';

const listings = [
  { id: 1, title: "Fender Stratocaster", price: 450, location: "London", category: "Guitar", description: "Great condition Strat, barely played. Comes with original case." },
  { id: 2, title: "Gibson Les Paul", price: 800, location: "Manchester", category: "Guitar", description: "2019 Les Paul Standard. Some light buckle rash on the back, plays perfectly." },
  { id: 3, title: "Roland TD-17", price: 300, location: "Newcastle", category: "Drums", description: "Electronic dumb kit, perfect for practice. All pads working." },
  { id: 4, title: "Martin D-28", price: 1200, location: "Bristol", category: "Guitar", description: "Stunning acoustic. Rich tone, low action. Serious offers only." },
  { id: 5, title: "Shure SM-58", price: 65, location: "Newcastle", category: "Microphone", description: "Classic dynamic vocal mic. Used for a handful of gigs, works perfectly." },
];

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const listing = listings.find(l => l.id === Number(id));

  if (!listing) return <div style={{ color: 'white', padding: '24px' }}>Listing not found.</div>;

  return (
    <div style={{ padding: '24px', color: 'white', maxWidth: '600px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: '1px solid #444', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '24px' }}
      >
        ← Back
      </button>
      <p style={{ color: '#888', margin: 0 }}>{listing.category}</p>
      <h1 style={{ margin: '8px 0' }}>{listing.title}</h1>
      <h2 style={{ color: '#4caf50', margin: '0 0 16px' }}>£{listing.price}</h2>
      <p style={{ color: '#aaa' }}>📍 {listing.location}</p>
      <p style={{ lineHeight: '1.6' }}>{listing.description}</p>
      <button
        style={{ marginTop: '24px', padding: '12px 24px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
      >
        Message Seller
      </button>
    </div>
  );
}

export default ListingDetail;