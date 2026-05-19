import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav style={{ background: '#1a1a1a', padding: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <h1 style={{ margin: 0 }}>ToneTrade</h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>UK Based Secondhand Instrument & Gear Marketplace</p>
      </div>
      <button
        onClick={() => navigate('/create')}
        style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
      >
        + Sell Gear
      </button>
    </nav>
  );
}

export default Navbar;