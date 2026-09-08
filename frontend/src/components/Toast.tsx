import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

export const Toast: React.FC = () => {
  const { toasts, dismissToast } = useAuction();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/85 border-rose-500/50 text-rose-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-amber-400" />}
            </span>
            <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
