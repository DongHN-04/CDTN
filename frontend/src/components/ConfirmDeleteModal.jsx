import React from 'react';

const ConfirmDeleteModal = ({
  isOpen,
  title = 'Xóa dữ liệu?',
  message = 'Bạn có chắc chắn muốn xóa mục này khỏi hệ thống không?',
  confirmText = 'Xóa',
  cancelText = 'Hủy',
  loading = false,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-600">!</div>
        <h2 className="m-0 text-xl font-black text-gray-950">{title}</h2>
        <p className="mt-2 text-sm font-medium text-gray-500">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-600 disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-[#c70d1a] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {loading ? 'Đang xóa...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
