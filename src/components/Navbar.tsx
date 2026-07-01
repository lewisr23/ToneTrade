import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{ background: '#1a1a1a', padding: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <h1 style={{ margin: 0 }}>ToneTrade</h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>UK Based Secondhand Instrument & Gear Marketplace</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user ? (
          <>
            <span style={{ color: '#aaa', fontSize: '14px' }}>Hi, {user.username}</span>
            <button
              onClick={() => navigate('/create')}
              style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            >
              + Sell Gear
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: '10px 16px', background: 'none', color: '#aaa', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/login')}
              style={{ padding: '10px 16px', background: 'none', color: 'white', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
