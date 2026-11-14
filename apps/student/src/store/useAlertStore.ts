import { create } from 'zustand';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface AlertStateItem {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isDestructive?: boolean;
}

interface AlertStore {
  activeAlert: AlertStateItem | null;
  showAlert: (item: Omit<AlertStateItem, 'id'>) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; cancelText?: string; isDestructive?: boolean; onCancel?: () => void },
  ) => void;
  closeAlert: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  activeAlert: null,

  showAlert: (item) => {
    set({
      activeAlert: {
        ...item,
        id: Math.random().toString(36).substring(2, 9),
      },
    });
  },

  showSuccess: (title, message) => {
    set({
      activeAlert: {
        id: Math.random().toString(36).substring(2, 9),
        title,
        message,
        type: 'success',
        confirmText: 'Done',
      },
    });
  },

  showError: (title, message) => {
    set({
      activeAlert: {
        id: Math.random().toString(36).substring(2, 9),
        title,
        message,
        type: 'error',
        confirmText: 'Understood',
        isDestructive: true,
      },
    });
  },

  showWarning: (title, message) => {
    set({
      activeAlert: {
        id: Math.random().toString(36).substring(2, 9),
        title,
        message,
        type: 'warning',
        confirmText: 'Continue',
      },
    });
  },

  showConfirm: (title, message, onConfirm, options) => {
    set({
      activeAlert: {
        id: Math.random().toString(36).substring(2, 9),
        title,
        message,
        type: 'confirm',
        confirmText: options?.confirmText || 'Confirm',
        cancelText: options?.cancelText || 'Cancel',
        onConfirm,
        onCancel: options?.onCancel,
        isDestructive: options?.isDestructive ?? false,
      },
    });
  },

  closeAlert: () => {
    set({ activeAlert: null });
  },
}));

/**
 * Global helper to replace raw window.alert with a luxury themed dialog.
 */
export function webAlert(title: string, message?: string, onConfirm?: () => void): void {
  const store = useAlertStore.getState();
  const msg = message || '';
  const isErr = title.toLowerCase().includes('error') || title.toLowerCase().includes('fail') || title.toLowerCase().includes('required');

  store.showAlert({
    title,
    message: msg,
    type: isErr ? 'error' : 'info',
    confirmText: 'OK',
    onConfirm,
  });
}
