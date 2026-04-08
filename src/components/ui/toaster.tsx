/**
 * Minimal Toaster stub for shadcn/ui compatibility.
 * Replace with full shadcn/ui install when ready.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function toast(opts: Omit<Toast, 'id'>) {
  // No-op in stub -- would need global state for full implementation
  console.log('[toast]', opts.title, opts.description);
}

export function Toaster() {
  return null;
}
