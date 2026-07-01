import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8080';

const categoryToEnum: Record<string, string> = {
  'Guitar': 'GUITAR',
  'Drums': 'DRUMS',
  'Microphone': 'MICROPHONE',
  'Synths': 'SYNTHS',
  'Audio Equipment': 'AUDIO_EQUIPMENT',
};

const conditionOptions = ['MINT', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    price: '',
    location: '',
    category: 'Guitar',
    condition: 'GOOD',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div style={{ padding: '24px', color: 'white' }}>
        <p>You need to <span style={{ color: '#4caf50', cursor: 'pointer' }} onClick={() => navigate('/login')}>log in</span> to create a listing.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: parseFloat(form.price),
          location: form.location,
          category: categoryToEnum[form.category],
          condition: form.condition,
        }),
      });
      if (!res.ok) {
        setError('Failed to create listing.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      navigate(`/listing/${data.id}`);
    } catch {
      setError('Could not connect to server.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px', color: 'white', maxWidth: '500px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: '1px solid #444', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '24px' }}
      >
        ← Back
      </button>
      <h1 style={{ marginBottom: '24px' }}>Create a Listing</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Title *</label>
        <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Fender Stratocaster" required
          style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }} />

        <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Price (£) *</label>
        <input name="price" value={form.price} onChange={handleChange} placeholder="e.g. 450" type="number" required
          style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }} />

        <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Location *</label>
        <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Newcastle" required
          style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }} />

        <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Category</label>
        <select name="category" value={form.category} onChange={handleChange}
          style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px' }}>
          {Object.keys(categoryToEnum).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Condition</label>
        <select name="condition" value={form.condition} onChange={handleChange}
          style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px' }}>
          {conditionOptions.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
        </select>

        <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the item, condition, what's included..."
          rows={4}
          style={{ width: '100%', padding: '10px', marginBottom: '24px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px', resize: 'vertical', boxSizing: 'border-box' }} />

        {error && <p style={{ color: '#f44', margin: '0 0 16px' }}>{error}</p>}

        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: '12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
          {loading ? 'Posting...' : 'Post Listing'}
        </button>
      </form>
    </div>
  );
}

export default CreateListing;
