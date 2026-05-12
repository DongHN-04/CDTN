import React, { useState, useEffect } from 'react';
import supplierService from '../../services/supplierService';
import SupplierForm from '../../components/SupplierForm';
import PurchaseForm from '../../components/PurchaseForm';

const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState(null);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa?')) {
      await supplierService.deleteSupplier(id);
      fetchSuppliers();
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier._id, formData);
      } else {
        await supplierService.createSupplier(formData);
      }
      setShowForm(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi');
    }
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseForm(false);
    fetchSuppliers();
  };

  const handlePayDebt = async () => {
    const amount = prompt('Nhập số tiền thanh toán (VNĐ):');
    if (!amount) return;
    try {
      await supplierService.payDebt(payingSupplier._id, Number(amount));
      setPayingSupplier(null);
      fetchSuppliers();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi thanh toán');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý Nhà cung cấp</h2>
      <button onClick={() => { setEditingSupplier(null); setShowForm(true); }} style={{ marginRight: 10, marginBottom: 20, padding: '10px 20px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        + Thêm nhà cung cấp
      </button>
      <button onClick={() => setShowPurchaseForm(true)} style={{ marginBottom: 20, padding: '10px 20px', background: '#e67e22', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        Nhập hàng
      </button>

      {showForm && (
        <SupplierForm supplier={editingSupplier} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
      )}

      {showPurchaseForm && (
        <PurchaseForm onClose={() => setShowPurchaseForm(false)} onSuccess={handlePurchaseSuccess} />
      )}

      {payingSupplier && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 300, textAlign: 'center' }}>
            <h3>Thanh toán công nợ</h3>
            <p>Nhà cung cấp: {payingSupplier.name}</p>
            <p>Công nợ hiện tại: {payingSupplier.debt.toLocaleString()}₫</p>
            <button onClick={handlePayDebt} style={{ padding: 10, background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Xác nhận</button>
            <button onClick={() => setPayingSupplier(null)} style={{ padding: 10, marginLeft: 10, background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Hủy</button>
          </div>
        </div>
      )}

      {loading ? <p>Đang tải...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead><tr><th>Tên</th><th>Liên hệ</th><th>SĐT</th><th>Email</th><th>Công nợ</th><th></th></tr></thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s._id}>
                <td>{s.name}</td><td>{s.contactPerson}</td><td>{s.phone}</td><td>{s.email}</td>
                <td style={{ color: s.debt > 0 ? 'red' : 'green' }}>{s.debt.toLocaleString()}₫</td>
                <td>
                  <button onClick={() => { setEditingSupplier(s); setShowForm(true); }} style={{ marginRight: 5 }}>Sửa</button>
                  <button onClick={() => handleDelete(s._id)} style={{ marginRight: 5 }}>Xóa</button>
                  {s.debt > 0 && <button onClick={() => setPayingSupplier(s)} style={{ background: '#f39c12', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '5px 10px' }}>Thanh toán</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SupplierManagementPage;