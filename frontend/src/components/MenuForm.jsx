import React, { useState, useEffect } from 'react';
import inventoryService from '../services/inventoryService';
import uploadService from '../services/uploadService';

const MenuForm = ({ menuItem, onSubmit, onCancel }) => {
  const [form, setForm] = useState({ name: '', price: 0, description: '', category: 'Món chính', image: '' });
  const [ingredientsList, setIngredientsList] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [imageFile, setImageFile] = useState(null);      // file ảnh mới chọn
  const [imagePreview, setImagePreview] = useState('');  // URL xem trước
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    inventoryService.getIngredients().then(data => setIngredientsList(data));
    if (menuItem) {
      setForm({
        name: menuItem.name,
        price: menuItem.price,
        description: menuItem.description || '',
        category: menuItem.category,
        image: menuItem.image || ''
      });
      setSelectedIngredients(
        menuItem.ingredients
          .filter(ing => ing.ingredient)
          .map(ing => ({ ingredient: ing.ingredient._id, quantity: ing.quantity }))
      );
      // Hiển thị ảnh cũ nếu có
      if (menuItem.image) {
        setImagePreview('http://localhost:5000' + menuItem.image);
      }
    } else {
      setSelectedIngredients([]);
      setImagePreview('');
    }
  }, [menuItem]);

  // Khi chọn file ảnh mới
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) return alert('Tên và danh mục là bắt buộc');
    for (let ing of selectedIngredients) {
      if (!ing.ingredient || ing.quantity <= 0) return alert('Chọn nguyên liệu và số lượng > 0');
    }

    let imageUrl = form.image; // giữ ảnh cũ nếu không chọn file mới
    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadService.uploadImage(imageFile);
        setForm({ ...form, image: imageUrl });
      } catch (error) {
        alert('Upload ảnh thất bại: ' + (error.response?.data?.message || error.message));
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit({ ...form, image: imageUrl, ingredients: selectedIngredients });
  };

  const addRow = () => setSelectedIngredients([...selectedIngredients, { ingredient: '', quantity: 0 }]);
  const removeRow = idx => setSelectedIngredients(selectedIngredients.filter((_, i) => i !== idx));
  const handleIngredientChange = (idx, field, value) => {
    const newArr = [...selectedIngredients];
    newArr[idx] = { ...newArr[idx], [field]: value };
    setSelectedIngredients(newArr);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: '80%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto' }}>
        <h3>{menuItem ? 'Sửa' : 'Thêm'} món</h3>
        <form onSubmit={handleSubmit}>
          <label>Tên món:</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /><br/>
          <label>Giá:</label><input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /><br/>
          <label>Mô tả:</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /><br/>
          <label>Danh mục:</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            <option>Khai vị</option><option>Món chính</option><option>Đồ uống</option><option>Tráng miệng</option>
          </select><br/>

          <label>Ảnh món ăn:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', display: 'block', marginTop: '5px' }} />}
          {form.image && !imageFile && <p>Ảnh hiện tại: <a href={'http://localhost:5000' + form.image} target="_blank" rel="noreferrer">Xem</a></p>}
          <br/>

          <fieldset>
            <legend>Nguyên liệu</legend>
            {selectedIngredients.map((ing, idx) => (
              <div key={idx}>
                <select value={ing.ingredient} onChange={e => handleIngredientChange(idx, 'ingredient', e.target.value)}>
                  <option value="">-- Chọn --</option>
                  {ingredientsList.map(i => <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}
                </select>
                <input type="number" placeholder="Số lượng" value={ing.quantity} onChange={e => handleIngredientChange(idx, 'quantity', Number(e.target.value))} />
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

export default MenuForm;