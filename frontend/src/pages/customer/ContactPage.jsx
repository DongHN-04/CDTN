import React from 'react';

const ContactPage = () => {
  return (
    <section className="px-5 py-12 max-w-5xl mx-auto">
      <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
        <p className="text-sm font-semibold text-[#c0392b] uppercase tracking-wide mb-2">
          Lien he
        </p>
        <h1 className="text-3xl font-black text-gray-900 mb-4">
          Thong tin cua hang
        </h1>
        <div className="grid gap-4 text-gray-700">
          <p><strong>Dia chi:</strong> Kim Giang, Dai Kim, Hoang Mai, Ha Noi</p>
          <p><strong>Dien thoai:</strong> 0338869004</p>
          <p><strong>Gio mo cua:</strong> 08:00 - 22:00</p>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
