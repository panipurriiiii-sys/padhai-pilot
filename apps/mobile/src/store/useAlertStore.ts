import { create } from 'zustand';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

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
 * Drop-in luxury alert replacement for React Native's Alert.alert.
 * Matches standard (title, message, buttons) signature.
 */
export function presentAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  const store = useAlertStore.getState();
  const textMsg = message || '';

  if (!buttons || buttons.length <= 1) {
    const singleBtn = buttons?.[0];
    store.showAlert({
      title,
      message: textMsg,
      type: title.toLowerCase().includes('error') || title.toLowerCase().includes('fail') ? 'error' : 'info',
      confirmText: singleBtn?.text || 'OK',
      onConfirm: singleBtn?.onPress,
    });
    return;
  }

  // Multi-button alert -> Confirmation modal
  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

  store.showAlert({
    title,
    message: textMsg,
    type: confirmBtn?.style === 'destructive' ? 'error' : 'confirm',
    confirmText: confirmBtn?.text || 'Confirm',
    cancelText: cancelBtn?.text || 'Cancel',
    onConfirm: confirmBtn?.onPress,
    onCancel: cancelBtn?.onPress,
    isDestructive: confirmBtn?.style === 'destructive',
  });
}
