import { useNavigate } from 'react-router-dom';

function ListingCard({ id, title, price, location, category }: { id: number, title: string, price: number, location: string, category: string }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/listing/${id}`)}
      style={{ border: '1px solid #444', borderRadius: '8px', padding: '16px', width: '200px', background: '#1a1a1a', color: 'white', cursor: 'pointer' }}
    >
      <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{category}</p>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p>£{price}</p>
      <p>{location}</p>
    </div>
  );
}

export default ListingCard;