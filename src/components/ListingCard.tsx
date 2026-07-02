import { useNavigate } from 'react-router-dom';

function ListingCard({ id, title, price, location, category, status }: { id: number, title: string, price: number, location: string, category: string, status?: string }) {
  const navigate = useNavigate();
  const isSold = status === 'SOLD';

  return (
    <div
      onClick={() => navigate(`/listing/${id}`)}
      style={{
        border: '1px solid #444',
        borderRadius: '8px',
        padding: '16px',
        width: '200px',
        background: '#1a1a1a',
        color: 'white',
        cursor: 'pointer',
        opacity: isSold ? 0.55 : 1,
        position: 'relative',
      }}
    >
      {isSold && (
        <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '11px', fontWeight: 700, color: '#111', background: '#4caf50', padding: '2px 8px', borderRadius: '4px' }}>
          SOLD
        </span>
      )}
      <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{category}</p>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p>£{price}</p>
      <p>{location}</p>
    </div>
  );
}

export default ListingCard;
