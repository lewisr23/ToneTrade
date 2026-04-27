function ListingCard({ title, price, location, category }: { title: string, price: number, location: string, category: string }) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', width: '200px' }}>
      <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{category}</p>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p>£{price}</p>
      <p>{location}</p>
    </div>
  );
}

export default ListingCard;