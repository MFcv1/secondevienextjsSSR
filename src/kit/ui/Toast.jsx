import { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, { type = 'error', duration = 5000 } = {}) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 right-4 z-[100000] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '400px' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`sv-toast pointer-events-auto cursor-pointer rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm
                ${toast.type === 'error'
                  ? 'bg-red-500/90 text-white border-red-400/50'
                  : toast.type === 'success'
                  ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/90 text-white border-amber-400/50'
                  : 'bg-gray-800/90 text-white border-gray-600/50'
                }`}
            onClick={() => removeToast(toast.id)}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
