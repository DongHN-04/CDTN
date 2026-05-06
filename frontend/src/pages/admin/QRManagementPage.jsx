import React, { useState } from 'react';
import QRCodeGenerator from '../../components/QRCodeGenerator';

const QRManagementPage = () => {
  const [tables, setTables] = useState([]);
  const [startTable, setStartTable] = useState(1);
  const [endTable, setEndTable] = useState(10);

  const generateQRCodes = () => {
    const newTables = [];
    for (let i = startTable; i <= endTable; i++) {
      newTables.push(i);
    }
    setTables(newTables);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Quản lý Mã QR Bàn</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <div>
          <label>Từ bàn:</label>
          <input
            type="number"
            min={1}
            value={startTable}
            onChange={e => setStartTable(Number(e.target.value))}
            style={{ marginLeft: '5px', padding: '5px', width: '80px' }}
          />
        </div>
        <div>
          <label>Đến bàn:</label>
          <input
            type="number"
            min={1}
            value={endTable}
            onChange={e => setEndTable(Number(e.target.value))}
            style={{ marginLeft: '5px', padding: '5px', width: '80px' }}
          />
        </div>
        <button
          onClick={generateQRCodes}
          style={{
            padding: '8px 20px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Tạo QR
        </button>
        {tables.length > 0 && (
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 20px',
              background: '#e67e22',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            In QR
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        {tables.map(tableNumber => (
          <QRCodeGenerator key={tableNumber} tableNumber={tableNumber} size={120} />
        ))}
      </div>

      {tables.length === 0 && (
        <p>Chưa có QR nào. Hãy nhập khoảng bàn và nhấn "Tạo QR".</p>
      )}
    </div>
  );
};

export default QRManagementPage;