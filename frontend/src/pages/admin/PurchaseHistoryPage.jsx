import React, { useState, useEffect } from 'react';
import supplierService from '../../services/supplierService';

const PurchaseHistoryPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supplierService.getPurchases().then(data => setPurchases(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Lịch sử Nhập hàng</h2>
      {loading ? <p>Đang tải...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead><tr><th>Ngày</th><th>Nhà cung cấp</th><th>Tổng tiền</th><th>Đã trả</th><th>Công nợ sau</th><th>Sản phẩm</th></tr></thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p._id}>
                <td>{new Date(p.purchaseDate).toLocaleDateString('vi-VN')}</td>
                <td>{p.supplier?.name}</td>
                <td>{p.totalAmount?.toLocaleString()}₫</td>
                <td>{p.paidAmount?.toLocaleString()}₫</td>
                <td style={{ color: p.debtAfterPurchase > 0 ? 'red' : 'green' }}>{p.debtAfterPurchase?.toLocaleString()}₫</td>
                <td>{p.items?.map(i => `${i.ingredient?.name} x${i.quantity}`).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PurchaseHistoryPage;