import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import supplierService from '../../services/supplierService';

const PAGE_SIZE = 5;

const formatCurrency = (value = 0, compact = false) => {
  const number = Number(value || 0);
  if (compact && Math.abs(number) >= 1000000) {
    return `${(number / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`;
  }
  return `${number.toLocaleString('vi-VN')}đ`;
};

const getPaymentStatus = (purchase) => {
  const paid = Number(purchase.paidAmount || 0);
  const total = Number(purchase.totalAmount || 0);
  if (paid >= total) return { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700' };
  if (paid > 0) return { label: 'Thanh toán một phần', className: 'bg-amber-50 text-amber-700' };
  return { label: 'Chờ thanh toán', className: 'bg-yellow-50 text-yellow-700' };
};

const PurchaseHistoryPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await supplierService.getPurchases();
        setPurchases(data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải lịch sử nhập hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonthPurchases = purchases.filter(purchase => {
      const date = new Date(purchase.purchaseDate);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    return {
      count: currentMonthPurchases.length,
      total: currentMonthPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount || 0), 0),
    };
  }, [purchases]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: `T${date.getMonth() + 1}`,
        total: 0,
      };
    });

    purchases.forEach(purchase => {
      const date = new Date(purchase.purchaseDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = months.find(item => item.key === key);
      if (month) month.total += Number(purchase.totalAmount || 0);
    });

    const maxValue = Math.max(...months.map(item => item.total), 1);
    return months.map(item => ({
      ...item,
      height: Math.max(6, Math.round((item.total / maxValue) * 120)),
    }));
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return purchases.filter(purchase => {
      const status = getPaymentStatus(purchase).label;
      const code = `IMP-${purchase._id.slice(-8).toUpperCase()}`;
      const itemsText = purchase.items?.map(item => item.ingredient?.name).join(' ') || '';
      const matchesSearch = !keyword || [
        code,
        purchase.supplier?.name,
        itemsText,
        purchase.notes,
      ].filter(Boolean).join(' ').toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'paid' && status === 'Đã thanh toán')
        || (statusFilter === 'partial' && status === 'Thanh toán một phần')
        || (statusFilter === 'pending' && status === 'Chờ thanh toán');

      return matchesSearch && matchesStatus;
    });
  }, [purchases, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredPurchases.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleExport = () => {
    const summaryRows = filteredPurchases.map(purchase => ({
      'Mã phiếu': `IMP-${purchase._id.slice(-8).toUpperCase()}`,
      'Ngày nhập': new Date(purchase.purchaseDate).toLocaleDateString('vi-VN'),
      'Nhà cung cấp': purchase.supplier?.name || '',
      'Tổng mặt hàng': purchase.items?.length || 0,
      'Tổng giá trị': purchase.totalAmount || 0,
      'Đã trả': purchase.paidAmount || 0,
      'Công nợ sau': purchase.debtAfterPurchase || 0,
      'Trạng thái': getPaymentStatus(purchase).label,
    }));

    const detailRows = filteredPurchases.flatMap(purchase => (
      (purchase.items || []).map(item => ({
        'Mã phiếu': `IMP-${purchase._id.slice(-8).toUpperCase()}`,
        'Ngày nhập': new Date(purchase.purchaseDate).toLocaleDateString('vi-VN'),
        'Nhà cung cấp': purchase.supplier?.name || '',
        'Nguyên liệu': item.ingredient?.name || '',
        'Đơn vị': item.ingredient?.unit || '',
        'Số lượng': item.quantity || 0,
        'Đơn giá': item.unitPrice || 0,
        'Thành tiền': item.totalPrice || 0,
      }))
    ));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Tong hop');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows), 'Chi tiet');
    XLSX.writeFile(workbook, 'lich-su-nhap-hang.xlsx');
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="m-0 text-3xl font-black tracking-tight text-gray-950">Lịch sử nhập hàng</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Quản lý và theo dõi chi tiết các phiếu nhập kho.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="rounded-xl border border-red-100 bg-white px-4 py-3 text-xs font-black text-gray-700 shadow-sm hover:border-[#c70d1a]"
          >
            Xuất Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_240px]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="m-0 text-lg font-black text-gray-950">Chi phí nhập hàng 6 tháng gần nhất</h2>
            <span className="rounded-full bg-[#f6f1ef] px-3 py-1 text-xs font-black text-red-950">Năm {new Date().getFullYear()}</span>
          </div>
          <div className="flex h-[180px] items-end justify-between gap-5 border-b border-gray-100 px-4">
            {chartData.map(item => (
              <div key={item.key} className="flex flex-1 flex-col items-center justify-end gap-2">
                <div className="relative flex h-[132px] w-full items-end justify-center">
                  <div
                    className={`w-8 rounded-t-lg ${item.total > 0 ? 'bg-[#c70d1a]' : 'bg-gray-200'}`}
                    style={{ height: item.height }}
                    title={`${item.label}: ${formatCurrency(item.total)}`}
                  />
                </div>
                <span className="text-xs font-black text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5">
          <StatCard title="Tổng phiếu tháng này" value={monthlyStats.count} hint="+ so với tháng trước" icon="⌘" />
          <StatCard title="Tổng chi tháng này" value={formatCurrency(monthlyStats.total, true)} hint="+ đang theo dõi" icon="▣" />
        </div>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm kiếm theo mã phiếu, nhà cung cấp..."
              className="w-full rounded-xl border border-red-100 bg-white py-3 pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#c70d1a] focus:ring-2 focus:ring-red-100"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-black text-gray-700 outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="partial">Thanh toán một phần</option>
              <option value="pending">Chờ thanh toán</option>
            </select>
            <button className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-black text-gray-700">☰</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-black uppercase tracking-widest text-red-950">
                <th className="px-4 py-3">Mã phiếu</th>
                <th className="px-4 py-3">Ngày nhập</th>
                <th className="px-4 py-3">Nhà cung cấp</th>
                <th className="px-4 py-3">Tổng mặt hàng</th>
                <th className="px-4 py-3">Tổng giá trị</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-sm font-bold text-gray-500">Đang tải...</td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-sm font-bold text-gray-500">Không có phiếu nhập phù hợp.</td>
                </tr>
              ) : (
                pageItems.map(purchase => (
                  <PurchaseRow key={purchase._id} purchase={purchase} onView={() => setSelectedPurchase(purchase)} />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between text-xs font-bold text-gray-500">
          <span>
            Hiển thị {filteredPurchases.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}
            -{Math.min(currentPage * PAGE_SIZE, filteredPurchases.length)} của {filteredPurchases.length} mục
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              className="rounded-lg px-3 py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setPage(index + 1)}
                className={`h-8 w-8 rounded-lg font-black ${currentPage === index + 1 ? 'bg-[#c70d1a] text-white' : 'hover:bg-gray-100'}`}
              >
                {index + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              className="rounded-lg px-3 py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {selectedPurchase && (
        <PurchaseDetailModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, hint, icon }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
    <div className="mb-4 flex items-center justify-between">
      <div className="text-[11px] font-black uppercase tracking-widest text-red-950">{title}</div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-[#c70d1a]">{icon}</div>
    </div>
    <div className="text-3xl font-black text-gray-950">{value}</div>
    <div className="mt-2 text-xs font-bold text-emerald-600">{hint}</div>
  </div>
);

const PurchaseRow = ({ purchase, onView }) => {
  const status = getPaymentStatus(purchase);
  const supplierName = purchase.supplier?.name || 'Nhà cung cấp';
  const initials = supplierName.slice(0, 2).toUpperCase();

  return (
    <tr className="border-t border-gray-50 text-sm text-gray-900 hover:bg-gray-50/70">
      <td className="px-4 py-5 font-black text-[#c70d1a]">#IMP-{purchase._id.slice(-8).toUpperCase()}</td>
      <td className="px-4 py-5 font-semibold">{new Date(purchase.purchaseDate).toLocaleDateString('vi-VN')}</td>
      <td className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-xs font-black text-sky-700">{initials}</div>
          <div>
            <div className="font-black text-gray-950">{supplierName}</div>
            <div className="line-clamp-1 text-xs font-semibold text-gray-400">
              {purchase.items?.map(item => item.ingredient?.name).filter(Boolean).join(', ') || 'Không có ghi chú'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-5 font-black">{purchase.items?.length || 0}</td>
      <td className="px-4 py-5 font-black">{formatCurrency(purchase.totalAmount)}</td>
      <td className="px-4 py-5">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${status.className}`}>{status.label}</span>
      </td>
      <td className="px-4 py-5 text-right">
        <button onClick={onView} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-black text-gray-700">Xem</button>
      </td>
    </tr>
  );
};

const PurchaseDetailModal = ({ purchase, onClose }) => {
  const status = getPaymentStatus(purchase);
  const code = `IMP-${purchase._id.slice(-8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-xl font-black text-gray-950">Chi tiết phiếu nhập {code}</h2>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              {new Date(purchase.purchaseDate).toLocaleDateString('vi-VN')} - {purchase.supplier?.name || 'Nhà cung cấp'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-600">Đóng</button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <DetailStat label="Tổng giá trị" value={formatCurrency(purchase.totalAmount)} />
          <DetailStat label="Đã trả" value={formatCurrency(purchase.paidAmount)} />
          <DetailStat label="Công nợ sau" value={formatCurrency(purchase.debtAfterPurchase)} />
          <DetailStat label="Trạng thái" value={status.label} />
        </div>

        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr className="bg-[#fbf8f7] text-left text-[11px] font-black uppercase tracking-widest text-red-950">
              <th className="px-4 py-3">Nguyên liệu</th>
              <th className="px-4 py-3">Số lượng</th>
              <th className="px-4 py-3">Đơn giá</th>
              <th className="px-4 py-3">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {(purchase.items || []).map(item => (
              <tr key={item._id || item.ingredient?._id} className="border-t border-gray-50 text-sm">
                <td className="px-4 py-3 font-black text-gray-950">{item.ingredient?.name || 'Nguyên liệu'}</td>
                <td className="px-4 py-3 font-semibold">{item.quantity} {item.ingredient?.unit || ''}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-3 font-black">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {purchase.notes && (
          <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">
            Ghi chú: {purchase.notes}
          </div>
        )}
      </div>
    </div>
  );
};

const DetailStat = ({ label, value }) => (
  <div className="rounded-xl bg-gray-50 p-4">
    <div className="text-[11px] font-black uppercase tracking-wider text-gray-400">{label}</div>
    <div className="mt-2 text-sm font-black text-gray-950">{value}</div>
  </div>
);

export default PurchaseHistoryPage;
