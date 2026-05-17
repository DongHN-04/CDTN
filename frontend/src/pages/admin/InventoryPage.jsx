import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import IngredientForm from '../../components/IngredientForm';
import { formatApiError } from '../../utils/apiError';

const InventoryPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const data = await inventoryService.getIngredients();
    setIngredients(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setSelected(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (ingredient) => {
    setSelected(ingredient);
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xoa nguyen lieu?')) {
      await inventoryService.deleteIngredient(id);
      setIngredients(ingredients.filter(i => i._id !== id));
    }
  };

  const handleSubmit = async (formData) => {
    setFormError('');

    try {
      if (selected) {
        const updated = await inventoryService.updateIngredient(selected._id, formData);
        setIngredients(ingredients.map(i => i._id === updated._id ? updated : i));
      } else {
        const created = await inventoryService.createIngredient(formData);
        setIngredients([...ingredients, created]);
      }
      setShowForm(false);
    } catch (error) {
      setFormError(formatApiError(error, 'Loi luu nguyen lieu'));
    }
  };

  return (
    <div>
      <h2>Quan ly Kho</h2>
      <button onClick={openCreate}>+ Them nguyen lieu</button>
      {loading ? <p>Dang tai...</p> : (
        <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 10 }}>
          <thead>
            <tr><th>Ten</th><th>Ton kho</th><th>Don vi</th><th>Gia nhap</th><th></th></tr>
          </thead>
          <tbody>
            {ingredients.map(ing => (
              <tr key={ing._id}>
                <td>{ing.name}</td>
                <td>{ing.stock}</td>
                <td>{ing.unit}</td>
                <td>{ing.pricePerUnit}</td>
                <td>
                  <button onClick={() => openEdit(ing)}>Sua</button>
                  <button onClick={() => handleDelete(ing._id)}>Xoa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <IngredientForm
          ingredient={selected}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default InventoryPage;
