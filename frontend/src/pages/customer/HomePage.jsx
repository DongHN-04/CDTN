import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', fontWeight: 'bold' }}>
          🍽️ Nhà Hàng Gourmet
        </h1>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>
          Thưởng thức những món ăn tuyệt hảo được chế biến từ những nguyên liệu tươi ngon nhất
        </p>
        <Link to="/menu" style={{
          background: 'white',
          color: '#c0392b',
          padding: '15px 40px',
          borderRadius: '30px',
          textDecoration: 'none',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Xem Thực Đơn
        </Link>
      </div>

      {/* Danh mục nổi bật */}
      <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Danh Mục Phổ Biến</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {['Khai vị', 'Món chính', 'Đồ uống', 'Tráng miệng'].map(cat => (
            <Link key={cat} to={`/menu?category=${cat}`} style={{
              background: '#f8f9fa',
              padding: '20px 40px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#333',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}>
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;