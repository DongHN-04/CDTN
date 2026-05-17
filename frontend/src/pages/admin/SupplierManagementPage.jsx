import React, { useState, useEffect } from 'react';
import supplierService from '../../services/supplierService';
import SupplierForm from '../../components/SupplierForm';
import PurchaseForm from '../../components/PurchaseForm';
import { formatApiError } from '../../utils/apiError';

const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState(null);
  const [formError, setFormError] = useState('');

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

  const openCreate = () => {
    setEditingSupplier(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xoa?')) {
      await supplierService.deleteSupplier(id);
      fetchSuppliers();
    }
  };

  const handleSubmit = async (formData) => {
    setFormError('');
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
      setFormError(formatApiError(error, 'Loi luu nha cung cap'));
    }
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseForm(false);
    fetchSuppliers();
  };

  const handlePayDebt = async () => {
    const amount = prompt('Nhap so tien thanh toan (VND):');
    if (!amount) return;
    try {
      await supplierService.payDebt(payingSupplier._id, Number(amount));
      setPayingSupplier(null);
      fetchSuppliers();
    } catch (error) {
      alert(formatApiError(error, 'Loi thanh toan'));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Quan ly Nha cung cap</h2>
      <button onClick={openCreate} style={createButtonStyle}>
        + Them nha cung cap
      </button>
      <button onClick={() => setShowPurchaseForm(true)} style={purchaseButtonStyle}>
        Nhap hang
      </button>

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showPurchaseForm && (
        <PurchaseForm onClose={() => setShowPurchaseForm(false)} onSuccess={handlePurchaseSuccess} />
      )}

      {payingSupplier && (
        <div style={overlayStyle}>
          <div style={payDebtModalStyle}>
            <h3>Thanh toan cong no</h3>
            <p>Nha cung cap: {payingSupplier.name}</p>
            <p>Cong no hien tai: {payingSupplier.debt.toLocaleString()}</p>
            <button onClick={handlePayDebt} style={confirmButtonStyle}>Xac nhan</button>
            <button onClick={() => setPayingSupplier(null)} style={cancelButtonStyle}>Huy</button>
          </div>
        </div>
      )}

      {loading ? <p>Dang tai...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr><th>Ten</th><th>Lien he</th><th>SDT</th><th>Email</th><th>Cong no</th><th></th></tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.contactPerson}</td>
                <td>{s.phone}</td>
                <td>{s.email}</td>
                <td style={{ color: s.debt > 0 ? 'red' : 'green' }}>{s.debt.toLocaleString()}</td>
                <td>
                  <button onClick={() => openEdit(s)} style={{ marginRight: 5 }}>Sua</button>
                  <button onClick={() => handleDelete(s._id)} style={{ marginRight: 5 }}>Xoa</button>
                  {s.debt > 0 && (
                    <button onClick={() => setPayingSupplier(s)} style={debtButtonStyle}>Thanh toan</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const createButtonStyle = { marginRight: 10, marginBottom: 20, padding: '10px 20px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };
const purchaseButtonStyle = { marginBottom: 20, padding: '10px 20px', background: '#e67e22', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const payDebtModalStyle = { background: 'white', padding: 20, borderRadius: 8, width: 300, textAlign: 'center' };
const confirmButtonStyle = { padding: 10, background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };
const cancelButtonStyle = { padding: 10, marginLeft: 10, background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };
const debtButtonStyle = { background: '#f39c12', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '5px 10px' };

export default SupplierManagementPage;
