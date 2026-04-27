function ListingCard({ title, price, location }: { title: string, price: number, location: string }) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', width: '200px' }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p>£{price}</p>
      <p>{location}</p>
    </div>
  );
}

export default ListingCard;