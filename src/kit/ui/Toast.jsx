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
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            className={`sv-toast pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm
                ${toast.type === 'error'
                  ? 'bg-red-500/90 text-white border-red-400/50'
                  : toast.type === 'success'
                  ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/90 text-white border-amber-400/50'
                  : 'bg-gray-800/90 text-white border-gray-600/50'
            }`}
          >
            <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>
            <button
              type="button"
              aria-label="Fermer la notification"
              className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg leading-none transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => removeToast(toast.id)}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
