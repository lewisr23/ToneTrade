import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    price: '',
    location: '',
    category: 'Guitar',
    description: ''
  });

  const categories = ["Guitar", "Drums", "Microphone", "Synths", "Audio Equipment"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.title || !form.price || !form.location) {
      alert('Please fill in all required fields');
      return;
    }
    alert(`Listing "${form.title}" created! (Backend coming soon)`);
    navigate('/');
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

      <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Title *</label>
      <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Fender Stratocaster"
        style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px' }} />

      <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Price (£) *</label>
      <input name="price" value={form.price} onChange={handleChange} placeholder="e.g. 450" type="number"
        style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px' }} />

      <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Location *</label>
      <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. London"
        style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px' }} />

      <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Category</label>
      <select name="category" value={form.category} onChange={handleChange}
        style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px' }}>
        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>

      <label style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>Description</label>
      <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the item, condition, what's included..."
        rows={4}
        style={{ width: '100%', padding: '10px', marginBottom: '24px', background: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px', resize: 'vertical' }} />

      <button onClick={handleSubmit}
        style={{ width: '100%', padding: '12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
        Post Listing
      </button>
    </div>
  );
}

export default CreateListing;