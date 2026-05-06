import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const result = await reportService.getReports(params);
      setData(result);
    } catch (err) {
      setError('Không thể tải dữ liệu báo cáo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    const start = e.target.startDate.value;
    const end = e.target.endDate.value;
    if (start && end) {
      fetchReports({ startDate: start, endDate: end });
    }
  };

  if (loading) return <p style={{ padding: '20px' }}>Đang tải dữ liệu...</p>;
  if (error) return <p style={{ padding: '20px', color: 'red' }}>{error}</p>;
  if (!data) return null;

  const formatCurrency = (value) => `${value.toLocaleString()}₫`;

  const chartData = data.dailyRevenue?.map(item => ({
    date: item._id,
    DoanhThu: item.revenue,
    DonHang: item.orders,
  })) || [];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Tổng quan hệ thống</h2>

      {/* Form lọc ngày */}
      <form onSubmit={handleFilter} style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <div>
          <label>Từ ngày:</label>
          <input type="date" name="startDate" style={inputStyle} />
        </div>
        <div>
          <label>Đến ngày:</label>
          <input type="date" name="endDate" style={inputStyle} />
        </div>
        <button type="submit" style={buttonStyle}>Lọc</button>
        <button type="button" onClick={() => fetchReports()} style={resetButtonStyle}>Xóa lọc</button>
      </form>

      {/* Các thẻ số liệu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <h3>Tổng doanh thu</h3>
          <p style={cardNumberStyle}>{formatCurrency(data.totalRevenue)}</p>
        </div>
        <div style={cardStyle}>
          <h3>Số đơn hàng</h3>
          <p style={cardNumberStyle}>{data.totalOrders}</p>
        </div>
        <div style={cardStyle}>
          <h3>Khách hàng</h3>
          <p style={cardNumberStyle}>{data.totalCustomers}</p>
        </div>
        <div style={cardStyle}>
          <h3>Món bán chạy</h3>
          <p style={cardNumberStyle}>{data.topItems?.[0]?.name || 'Chưa có'}</p>
        </div>
      </div>

      {/* Biểu đồ doanh thu theo ngày */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>Doanh thu theo ngày</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="DoanhThu" fill="#3498db" name="Doanh thu" />
              <Bar dataKey="DonHang" fill="#2ecc71" name="Số đơn" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p>Chưa có dữ liệu để hiển thị biểu đồ.</p>
        )}
      </div>

      {/* Top món bán chạy */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <h3>Top món bán chạy</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={thStyle}>Món</th>
              <th style={thStyle}>Số lượng bán</th>
              <th style={thStyle}>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {data.topItems?.map(item => (
              <tr key={item.menuItemId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.totalQuantity}</td>
                <td style={tdStyle}>{formatCurrency(item.totalRevenue)}</td>
              </tr>
            ))}
            {data.topItems?.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Chưa có dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styles
const cardStyle = {
  background: '#fff',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  textAlign: 'center',
};

const cardNumberStyle = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#2c3e50',
  margin: '10px 0 0',
};

const inputStyle = {
  padding: '6px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  marginLeft: '5px',
};

const buttonStyle = {
  padding: '8px 15px',
  background: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const resetButtonStyle = {
  padding: '8px 15px',
  background: '#95a5a6',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const thStyle = { padding: '12px 8px', textAlign: 'left' };
const tdStyle = { padding: '10px 8px' };

export default DashboardPage;