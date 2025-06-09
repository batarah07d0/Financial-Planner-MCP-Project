import { useState, useCallback } from 'react';
import { useAuthStore } from '../services/store';
import { getSecuritySettings } from '../../features/settings/services/userSettingsService';

export interface SensitiveActionAuthOptions {
  action: string;
  title?: string;
  message?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export interface DialogFunctions {
  showConfirm: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
  showError: (title: string, message: string) => void;
}

// Helper function untuk membuat pesan autentikasi yang user-friendly
const getAuthenticationMessage = (action: string): string => {
  if (action.startsWith('edit_')) {
    const itemType = action.replace('edit_', '');
    switch (itemType) {
      case 'transaksi':
        return 'Autentikasi untuk mengedit transaksi';
      case 'anggaran':
        return 'Autentikasi untuk mengedit anggaran';
      case 'tujuan tabungan':
        return 'Autentikasi untuk mengedit tujuan tabungan';
      case 'tantangan':
        return 'Autentikasi untuk mengedit tantangan';
      default:
        return `Autentikasi untuk mengedit ${itemType}`;
    }
  } else if (action.startsWith('delete_')) {
    const itemType = action.replace('delete_', '');
    switch (itemType) {
      case 'transaksi':
        return 'Autentikasi untuk menghapus transaksi';
      case 'anggaran':
        return 'Autentikasi untuk menghapus anggaran';
      case 'tujuan tabungan':
        return 'Autentikasi untuk menghapus tujuan tabungan';
      case 'tantangan':
        return 'Autentikasi untuk menghapus tantangan';
      default:
        return `Autentikasi untuk menghapus ${itemType}`;
    }
  } else if (action.startsWith('view_')) {
    const dataType = action.replace('view_', '');
    return `Autentikasi untuk melihat ${dataType}`;
  } else if (action.startsWith('add_')) {
    const itemType = action.replace('add_', '');
    return `Autentikasi untuk menambah ${itemType}`;
  }

  return 'Autentikasi untuk melanjutkan';
};

export const useSensitiveActionAuth = (dialogFunctions?: DialogFunctions) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Fungsi untuk melakukan autentikasi dengan fallback ke PIN
  const performAuthentication = useCallback(async (promptMessage: string): Promise<boolean> => {
    try {
      // Import LocalAuthentication di dalam fungsi untuk menghindari masalah import
      const LocalAuthentication = await import('expo-local-authentication');

      // Periksa ketersediaan biometrik
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        // Jika biometrik tersedia, gunakan biometrik
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          fallbackLabel: 'Gunakan PIN',
          cancelLabel: 'Batal',
        });
        return result.success;
      } else {
        // Jika biometrik tidak tersedia, gunakan PIN/password sistem
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          fallbackLabel: 'Gunakan PIN',
          cancelLabel: 'Batal',
          disableDeviceFallback: false, // Izinkan fallback ke PIN sistem
        });
        return result.success;
      }
    } catch (error) {
      // Authentication error - silently handled
      return false;
    }
  }, []);

  const authenticateAction = useCallback(async (options: SensitiveActionAuthOptions): Promise<boolean> => {
    const {
      action,
      title = 'Autentikasi Diperlukan',
      message = 'Silakan autentikasi untuk melanjutkan tindakan ini',
      onSuccess,
      onCancel
    } = options;

    try {
      setIsAuthenticating(true);

      // Tampilkan dialog konfirmasi
      return new Promise((resolve) => {
        if (dialogFunctions?.showConfirm) {
          dialogFunctions.showConfirm(
            title,
            message,
            async () => {
              try {
                // Lakukan autentikasi dengan fallback ke PIN
                const authSuccess = await performAuthentication(getAuthenticationMessage(action));

                if (authSuccess) {
                  onSuccess?.();
                  resolve(true);
                } else {
                  if (dialogFunctions?.showError) {
                    dialogFunctions.showError(
                      'Autentikasi Gagal',
                      'Autentikasi diperlukan untuk melanjutkan tindakan ini.'
                    );
                  }
                  onCancel?.();
                  resolve(false);
                }
              } catch (error) {
                if (dialogFunctions?.showError) {
                  dialogFunctions.showError(
                    'Error',
                    'Terjadi kesalahan saat autentikasi. Silakan coba lagi.'
                  );
                }
                onCancel?.();
                resolve(false);
              }
            },
            'Lanjutkan',
            'Batal'
          );
        } else {
          // Fallback ke autentikasi langsung jika tidak ada dialog functions
          performAuthentication(getAuthenticationMessage(action))
            .then((authSuccess) => {
              if (authSuccess) {
                onSuccess?.();
                resolve(true);
              } else {
                onCancel?.();
                resolve(false);
              }
            })
            .catch(() => {
              onCancel?.();
              resolve(false);
            });
        }
      });
    } catch (error) {
      if (dialogFunctions?.showError) {
        dialogFunctions.showError(
          'Error',
          'Terjadi kesalahan saat memeriksa kebutuhan autentikasi.'
        );
      }
      onCancel?.();
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [performAuthentication, dialogFunctions]);

  // Helper function untuk memeriksa autentikasi edit
  const checkEditAuthRequired = useCallback(async (): Promise<boolean> => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        return false;
      }

      const settings = await getSecuritySettings(user.id);
      return settings?.require_auth_for_edit || false;
    } catch (error) {
      return false;
    }
  }, []);

  // Helper function untuk memeriksa autentikasi hapus
  const checkDeleteAuthRequired = useCallback(async (): Promise<boolean> => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        return false;
      }

      const settings = await getSecuritySettings(user.id);
      return settings?.require_auth_for_delete || false;
    } catch (error) {
      return false;
    }
  }, []);

  // Helper function untuk tindakan hapus
  const authenticateDelete = useCallback(async (
    itemType: string,
    itemName?: string,
    onConfirm?: () => void
  ): Promise<boolean> => {
    try {
      const authRequired = await checkDeleteAuthRequired();

      if (!authRequired) {
        // Jika tidak perlu autentikasi, tampilkan konfirmasi biasa
        return new Promise((resolve) => {
          if (dialogFunctions?.showConfirm) {
            dialogFunctions.showConfirm(
              'Konfirmasi Hapus',
              `Apakah Anda yakin ingin menghapus ${itemName || itemType} ini? Tindakan ini tidak dapat dibatalkan.`,
              () => {
                onConfirm?.();
                resolve(true);
              },
              'Hapus',
              'Batal'
            );
          } else {
            // Fallback langsung eksekusi jika tidak ada dialog
            onConfirm?.();
            resolve(true);
          }
        });
      }

      // Jika perlu autentikasi, gunakan biometrik
      return authenticateAction({
        action: `delete_${itemType}`,
        title: 'Konfirmasi Hapus',
        message: `Apakah Anda yakin ingin menghapus ${itemName || itemType} ini? Tindakan ini tidak dapat dibatalkan.`,
        onSuccess: onConfirm,
      });
    } catch (error) {
      return false;
    }
  }, [authenticateAction, checkDeleteAuthRequired, dialogFunctions]);

  // Helper function untuk tindakan edit
  const authenticateEdit = useCallback(async (
    itemType: string,
    itemName?: string,
    onConfirm?: () => void
  ): Promise<boolean> => {
    try {
      const authRequired = await checkEditAuthRequired();

      if (!authRequired) {
        // Jika tidak perlu autentikasi, langsung jalankan
        onConfirm?.();
        return true;
      }

      // Jika perlu autentikasi, gunakan biometrik
      return authenticateAction({
        action: `edit_${itemType}`,
        title: 'Konfirmasi Edit',
        message: `Autentikasi diperlukan untuk mengedit ${itemName || itemType} ini.`,
        onSuccess: onConfirm,
      });
    } catch (error) {
      return false;
    }
  }, [authenticateAction, checkEditAuthRequired]);

  // Helper function untuk tindakan view data sensitif
  const authenticateView = useCallback(async (
    dataType: string,
    onConfirm?: () => void
  ): Promise<boolean> => {
    return authenticateAction({
      action: `view_${dataType}`,
      title: 'Autentikasi Diperlukan',
      message: `Autentikasi diperlukan untuk melihat ${dataType} ini.`,
      onSuccess: onConfirm,
    });
  }, [authenticateAction]);

  // Helper function untuk tindakan add
  const authenticateAdd = useCallback(async (
    itemType: string,
    onConfirm?: () => void
  ): Promise<boolean> => {
    return authenticateAction({
      action: `add_${itemType}`,
      title: 'Autentikasi Diperlukan',
      message: `Autentikasi diperlukan untuk menambah ${itemType} baru.`,
      onSuccess: onConfirm,
    });
  }, [authenticateAction]);

  return {
    isAuthenticating,
    authenticateAction,
    authenticateDelete,
    authenticateEdit,
    authenticateView,
    authenticateAdd,
    checkEditAuthRequired,
    checkDeleteAuthRequired,
  };
};
