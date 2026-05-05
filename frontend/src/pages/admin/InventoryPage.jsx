import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import IngredientForm from '../../components/IngredientForm';

const InventoryPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const data = await inventoryService.getIngredients();
    setIngredients(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Xóa nguyên liệu?')) {
      await inventoryService.deleteIngredient(id);
      setIngredients(ingredients.filter(i => i._id !== id));
    }
  };

  const handleSubmit = async (formData) => {
    if (selected) {
      const updated = await inventoryService.updateIngredient(selected._id, formData);
      setIngredients(ingredients.map(i => i._id === updated._id ? updated : i));
    } else {
      const created = await inventoryService.createIngredient(formData);
      setIngredients([...ingredients, created]);
    }
    setShowForm(false);
  };

  return (
    <div>
      <h2>Quản lý Kho</h2>
      <button onClick={() => { setSelected(null); setShowForm(true); }}>+ Thêm nguyên liệu</button>
      {loading ? <p>Đang tải...</p> : (
        <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 10 }}>
          <thead><tr><th>Tên</th><th>Tồn kho</th><th>Đơn vị</th><th>Giá nhập</th><th></th></tr></thead>
          <tbody>
            {ingredients.map(ing => (
              <tr key={ing._id}>
                <td>{ing.name}</td><td>{ing.stock}</td><td>{ing.unit}</td><td>{ing.pricePerUnit}</td>
                <td>
                  <button onClick={() => { setSelected(ing); setShowForm(true); }}>Sửa</button>
                  <button onClick={() => handleDelete(ing._id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && <IngredientForm ingredient={selected} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />}
    </div>
  );
};
export default InventoryPage;