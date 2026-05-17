import React from 'react';
import { Link } from 'react-router-dom';

const PromotionsPage = () => {
  return (
    <section className="px-5 py-12 max-w-5xl mx-auto">
      <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
        <p className="text-sm font-semibold text-[#c0392b] uppercase tracking-wide mb-2">
          Khuyen mai
        </p>
        <h1 className="text-3xl font-black text-gray-900 mb-4">
          Uu dai moi se duoc cap nhat tai day
        </h1>
        <p className="text-gray-600 leading-7 mb-6">
          Hien tai cua hang chua cong bo chuong trinh khuyen mai cong khai. Vui long xem thuc don hoac theo doi thong bao moi nhat tu cua hang.
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center justify-center bg-[#c0392b] text-white font-semibold px-5 py-3 rounded-lg no-underline hover:bg-red-800 transition-colors"
        >
          Xem thuc don
        </Link>
      </div>
    </section>
  );
};

export default PromotionsPage;
