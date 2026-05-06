import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import publicService from '../../services/publicService';
import { useLocation } from 'react-router-dom';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['Tất cả']);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const { addItem } = useCart();
  const location = useLocation();

  useEffect(() => {
    publicService.getMenu().then(data => {
      setMenuItems(data);
      const cats = ['Tất cả', ...new Set(data.map(item => item.category))];
      setCategories(cats);
    });
  }, []);

  // Nếu URL có category, lọc sẵn
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) setSelectedCategory(cat);
  }, [location]);

  const filteredMenu = menuItems.filter(item => {
    const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Thực Đơn</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Tìm món..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {filteredMenu.map(item => (
          <div key={item._id} style={{
            background: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }} onClick={() => addItem(item, 1)}>
            <img
              src={item.image ? (item.image.startsWith('data:image') ? item.image : `http://localhost:5000${item.image}`) : 'https://via.placeholder.com/300x200?text=No+Image'}
              alt={item.name}
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
            <div style={{ padding: '15px' }}>
              <h3 style={{ margin: '0 0 10px' }}>{item.name}</h3>
              <p style={{ color: '#666', margin: '0 0 10px' }}>{item.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>
                  {item.price.toLocaleString()}₫
                </span>
                <button style={{
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>+ Thêm</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;