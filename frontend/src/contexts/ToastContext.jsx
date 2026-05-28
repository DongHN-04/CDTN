import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const ToastContext = createContext(null);
const TOAST_TTL = 3200;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  // Ghi chu: dung hook useToast() trong moi trang roi goi showToast(message, type).
  // type hỗ trợ: success, error, info. Toast tự biến mất sau TOAST_TTL, không có nút đóng.
  const showToast = useCallback((message, type = 'success') => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(current => [...current, { id, message, type }]);
    window.setTimeout(() => dismissToast(id), TOAST_TTL);
  }, [dismissToast]);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
};

const toastStyles = {
  success: {
    icon: CheckCircle2,
    iconWrapClassName: 'bg-emerald-500 text-white',
  },
  error: {
    icon: AlertCircle,
    iconWrapClassName: 'bg-rose-500 text-white',
  },
  info: {
    icon: Info,
    iconWrapClassName: 'bg-sky-500 text-white',
  },
};

const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-[9999] flex w-[min(420px,calc(100vw-48px))] flex-col gap-3">
    {toasts.map(toast => {
      const style = toastStyles[toast.type] || toastStyles.success;
      const Icon = style.icon;
      return (
        <div
          key={toast.id}
          className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-white shadow-2xl animate-bounce duration-300"
        >
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${style.iconWrapClassName}`}>
            <Icon size={15} strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1 whitespace-pre-line text-sm font-semibold">{toast.message}</span>
        </div>
      );
    })}
  </div>
);
