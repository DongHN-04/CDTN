import React, { useState, useEffect } from 'react';
import inventoryService from '../services/inventoryService';
import uploadService from '../services/uploadService';
import { ErrorBox } from '../utils/apiError';
import { getImageUrl } from '../utils/imageUrl';

const MenuForm = ({ menuItem, onSubmit, onCancel, error }) => {
  const [form, setForm] = useState({ name: '', price: 0, description: '', category: 'Burger', image: '', isActive: true });
  const [ingredientsList, setIngredientsList] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    inventoryService.getIngredients().then(data => setIngredientsList(data));

    if (menuItem) {
      setForm({
        name: menuItem.name || '',
        price: menuItem.price ?? 0,
        description: menuItem.description || '',
        category: menuItem.category || 'Burger',
        image: menuItem.image || '',
        isActive: menuItem.isActive !== false,
      });
      setSelectedIngredients(
        (menuItem.ingredients || [])
          .filter(ing => ing.ingredient)
          .map(ing => ({ ingredient: ing.ingredient._id, quantity: ing.quantity }))
      );
      setImagePreview(getImageUrl(menuItem.image));
    } else {
      setForm({ name: '', price: 0, description: '', category: 'Burger', image: '', isActive: true });
      setSelectedIngredients([]);
      setImagePreview('');
    }

    setImageFile(null);
    setLocalError('');
  }, [menuItem]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const addRow = () => setSelectedIngredients([...selectedIngredients, { ingredient: '', quantity: 0 }]);
  const removeRow = idx => setSelectedIngredients(selectedIngredients.filter((_, i) => i !== idx));

  const handleIngredientChange = (idx, field, value) => {
    const newArr = [...selectedIngredients];
    newArr[idx] = { ...newArr[idx], [field]: value };
    setSelectedIngredients(newArr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!form.name.trim()) return setLocalError('name: Ten mon la bat buoc');
    if (!form.category.trim()) return setLocalError('category: Danh muc la bat buoc');
    if (Number(form.price) < 0) return setLocalError('price: Gia ban phai >= 0');

    for (const ing of selectedIngredients) {
      if (!ing.ingredient || Number(ing.quantity) <= 0) {
        return setLocalError('ingredients: Chon nguyen lieu va so luong > 0');
      }
    }

    let imageUrl = form.image;
    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadService.uploadImage(imageFile);
      } catch (error) {
        setLocalError('image: Upload anh that bai: ' + (error.response?.data?.message || error.message));
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit({
      ...form,
      price: Number(form.price),
      image: imageUrl,
      ingredients: selectedIngredients.map(ing => ({
        ingredient: ing.ingredient,
        quantity: Number(ing.quantity),
      })),
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>{menuItem ? 'Sửa' : 'Thêm'} món</h3>
        <ErrorBox message={localError || error} />
        <form onSubmit={handleSubmit}>
          <label>Tên món:</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />

          <label>Giá:</label>
          <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />

          <label>Mô tả:</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />

          <label>Danh mục:</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            <option>Burger</option>
            <option>Gà rán</option>
            <option>Đồ uống</option>
            <option>Combo</option>
            <option>Tráng miệng</option>
          </select>

          <label>Trạng thái:</label>
          <select value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })} style={inputStyle}>
            <option value="active">Còn hàng</option>
            <option value="inactive">Hết hàng</option>
          </select>

          <label>Ảnh món ăn:</label>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} style={inputStyle} />
          {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: 200, display: 'block', marginTop: 5 }} />}

          <fieldset style={{ marginTop: 12 }}>
            <legend>Nguyên liệu</legend>
            {selectedIngredients.map((ing, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={ing.ingredient} onChange={e => handleIngredientChange(idx, 'ingredient', e.target.value)} style={inputStyle}>
                  <option value="">-- Chọn --</option>
                  {ingredientsList.map(i => <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Số lượng"
                  value={ing.quantity}
                  onChange={e => handleIngredientChange(idx, 'quantity', e.target.value)}
                  style={inputStyle}
                />
                <button type="button" onClick={() => removeRow(idx)}>Xóa</button>
              </div>
            ))}
            <button type="button" onClick={addRow}>+ Thêm nguyên liệu</button>
          </fieldset>

          <div style={{ marginTop: 10 }}>
            <button type="submit" disabled={uploading}>{uploading ? 'Đang upload ảnh...' : 'Lưu'}</button>
            <button type="button" onClick={onCancel}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { background: '#fff', padding: 20, borderRadius: 8, width: '80%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto' };
const inputStyle = { display: 'block', width: '100%', marginBottom: 8, padding: 8, border: '1px solid #ccc', borderRadius: 4 };

export default MenuForm;
