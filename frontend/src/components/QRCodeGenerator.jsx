import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';


const QRCodeGenerator = ({ tableNumber, size = 150 }) => {
  const baseUrl = window.location.origin; // http://localhost:3000
  const url = `${baseUrl}/menu?table=${tableNumber}`;

  return (
    <div style={{ textAlign: 'center', padding: '15px', display: 'inline-block' }}>
      <QRCodeCanvas value={url} size={size} />
      <p style={{ marginTop: '8px', fontWeight: 'bold' }}>Bàn {tableNumber}</p>
      <p style={{ fontSize: '12px', color: '#666' }}>{url}</p>
    </div>
  );
};

export default QRCodeGenerator;