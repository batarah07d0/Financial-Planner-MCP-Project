import { useState, useCallback } from 'react';
import { DialogType, DialogAction } from '../components/SuperiorDialog';

export interface ShowDialogOptions {
  type: DialogType;
  title: string;
  message: string;
  actions?: DialogAction[];
  icon?: string;
  autoClose?: number;
}

export interface DialogState {
  visible: boolean;
  type: DialogType;
  title: string;
  message: string;
  actions: DialogAction[];
  icon?: string;
  autoClose?: number;
}

export const useSuperiorDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    actions: [],
  });

  const showDialog = useCallback((options: ShowDialogOptions) => {
    setDialogState({
      visible: true,
      type: options.type,
      title: options.title,
      message: options.message,
      actions: options.actions || [],
      icon: options.icon,
      autoClose: options.autoClose,
    });
  }, []);

  const hideDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Helper functions untuk berbagai jenis dialog
  const showSuccess = useCallback((title: string, message: string, autoClose?: number) => {
    showDialog({
      type: 'success',
      title,
      message,
      autoClose: autoClose || 2000,
      actions: [
        {
          text: 'OK',
          onPress: hideDialog,
          style: 'primary',
        },
      ],
    });
  }, [showDialog, hideDialog]);

  const showError = useCallback((title: string, message: string) => {
    showDialog({
      type: 'error',
      title,
      message,
      actions: [
        {
          text: 'OK',
          onPress: hideDialog,
          style: 'primary',
        },
      ],
    });
  }, [showDialog, hideDialog]);

  const showWarning = useCallback((title: string, message: string) => {
    showDialog({
      type: 'warning',
      title,
      message,
      actions: [
        {
          text: 'OK',
          onPress: hideDialog,
          style: 'primary',
        },
      ],
    });
  }, [showDialog, hideDialog]);

  const showInfo = useCallback((title: string, message: string) => {
    showDialog({
      type: 'info',
      title,
      message,
      actions: [
        {
          text: 'OK',
          onPress: hideDialog,
          style: 'primary',
        },
      ],
    });
  }, [showDialog, hideDialog]);

  const showConfirm = useCallback((
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmText: string = 'Ya',
    cancelText: string = 'Batal'
  ) => {
    showDialog({
      type: 'confirm',
      title,
      message,
      actions: [
        {
          text: cancelText,
          onPress: hideDialog,
          style: 'cancel',
        },
        {
          text: confirmText,
          onPress: () => {
            hideDialog();
            onConfirm();
          },
          style: 'primary',
        },
      ],
    });
  }, [showDialog, hideDialog]);

  const showDelete = useCallback((
    title: string, 
    message: string, 
    onDelete: () => void,
    deleteText: string = 'Hapus',
    cancelText: string = 'Batal'
  ) => {
    showDialog({
      type: 'delete',
      title,
      message,
      actions: [
        {
          text: cancelText,
          onPress: hideDialog,
          style: 'cancel',
        },
        {
          text: deleteText,
          onPress: () => {
            hideDialog();
            onDelete();
          },
          style: 'destructive',
        },
      ],
    });
  }, [showDialog, hideDialog]);

  const showLoading = useCallback((title: string, message: string) => {
    showDialog({
      type: 'loading',
      title,
      message,
      actions: [], // No actions for loading dialog
    });
  }, [showDialog]);

  const showAsyncAction = useCallback(async (
    title: string,
    message: string,
    asyncAction: () => Promise<void>,
    successTitle: string = 'Sukses',
    successMessage: string = 'Operasi berhasil dilakukan',
    errorTitle: string = 'Error',
    actionText: string = 'Ya',
    cancelText: string = 'Batal'
  ) => {
    return new Promise<boolean>((resolve) => {
      showDialog({
        type: 'confirm',
        title,
        message,
        actions: [
          {
            text: cancelText,
            onPress: () => {
              hideDialog();
              resolve(false);
            },
            style: 'cancel',
          },
          {
            text: actionText,
            onPress: async () => {
              // Show loading
              setDialogState(prev => ({
                ...prev,
                type: 'loading',
                title: 'Memproses...',
                message: 'Mohon tunggu sebentar',
                actions: [],
              }));

              try {
                await asyncAction();
                
                // Show success
                setDialogState(prev => ({
                  ...prev,
                  type: 'success',
                  title: successTitle,
                  message: successMessage,
                  autoClose: 2000,
                  actions: [
                    {
                      text: 'OK',
                      onPress: () => {
                        hideDialog();
                        resolve(true);
                      },
                      style: 'primary',
                    },
                  ],
                }));
              } catch (error: unknown) {
                // Show error
                const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
                setDialogState(prev => ({
                  ...prev,
                  type: 'error',
                  title: errorTitle,
                  message: errorMessage,
                  actions: [
                    {
                      text: 'OK',
                      onPress: () => {
                        hideDialog();
                        resolve(false);
                      },
                      style: 'primary',
                    },
                  ],
                }));
              }
            },
            style: 'primary',
          },
        ],
      });
    });
  }, [showDialog, hideDialog]);

  return {
    dialogState,
    showDialog,
    hideDialog,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showDelete,
    showLoading,
    showAsyncAction,
  };
};
