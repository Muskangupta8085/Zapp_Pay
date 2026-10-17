import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Alert as RNAlert } from 'react-native';
import {
  CustomAlertModal,
  AlertType,
  AlertButton,
} from '../components/common/CustomAlertModal';

export interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  badgeText?: string;
  buttons?: AlertButton[];
  dismissable?: boolean;
}

export interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  showSuccess: (title: string, message?: string, onPress?: () => void) => void;
  showError: (title: string, message?: string, onPress?: () => void) => void;
  showWarning: (title: string, message?: string, onPress?: () => void) => void;
  showInfo: (title: string, message?: string, onPress?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Standalone global dispatcher for non-component calls (e.g., API interceptors, service files)
type GlobalAlertHandler = (options: AlertOptions) => void;
let globalAlertHandler: GlobalAlertHandler | null = null;

export const alertService = {
  show: (options: AlertOptions) => {
    if (globalAlertHandler) {
      globalAlertHandler(options);
    } else {
      // Fallback to native alert if provider is not yet mounted
      RNAlert.alert(options.title, options.message);
    }
  },
  success: (title: string, message?: string, onPress?: () => void) => {
    alertService.show({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'Great!', onPress }],
    });
  },
  error: (title: string, message?: string, onPress?: () => void) => {
    alertService.show({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'Understood', onPress }],
    });
  },
  warning: (title: string, message?: string, onPress?: () => void) => {
    alertService.show({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'Acknowledge', onPress }],
    });
  },
  info: (title: string, message?: string, onPress?: () => void) => {
    alertService.show({
      title,
      message,
      type: 'info',
      buttons: [{ text: 'OK', onPress }],
    });
  },
  confirm: (
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    alertService.show({
      title,
      message,
      type: 'info',
      buttons: [
        { text: cancelText, style: 'cancel', onPress: onCancel },
        { text: confirmText, style: 'default', onPress: onConfirm },
      ],
    });
  },
};

// Automatic alert type inference based on keywords
export function inferAlertType(title: string, message?: string): AlertType {
  const combined = `${title} ${message || ''}`.toLowerCase();

  const errorKeywords = [
    'fail',
    'failed',
    'error',
    'invalid',
    'incomplete',
    'unauthorized',
    'denied',
    'wrong',
    'rejected',
    'not found',
    'expired',
    'cannot',
    'could not',
    'unable',
  ];
  if (errorKeywords.some((kw) => combined.includes(kw))) {
    return 'error';
  }

  const successKeywords = [
    'success',
    'successful',
    'verified',
    'confirmed',
    'completed',
    'saved',
    'copied',
    'sent',
    'boost',
    'updated',
    'deposited',
    'claimed',
    'welcome',
  ];
  if (successKeywords.some((kw) => combined.includes(kw))) {
    return 'success';
  }

  const warningKeywords = [
    'warning',
    'caution',
    'attention',
    'cancel',
    'cancelled',
    'alert',
    'missing',
    'limit',
    'low',
    'exceed',
  ];
  if (warningKeywords.some((kw) => combined.includes(kw))) {
    return 'warning';
  }

  return 'info';
}

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: AlertType;
    badgeText?: string;
    buttons?: AlertButton[];
    dismissable?: boolean;
  }>({
    visible: false,
    title: '',
    type: 'info',
  });

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback((options: AlertOptions) => {
    const resolvedType = options.type || inferAlertType(options.title, options.message);

    // Ensure buttons close the modal when tapped
    const wrappedButtons = options.buttons?.map((btn) => ({
      ...btn,
      onPress: () => {
        setAlertState((prev) => ({ ...prev, visible: false }));
        if (btn.onPress) {
          btn.onPress();
        }
      },
    }));

    setAlertState({
      visible: true,
      title: options.title,
      message: options.message,
      type: resolvedType,
      badgeText: options.badgeText,
      buttons: wrappedButtons,
      dismissable: options.dismissable ?? true,
    });
  }, []);

  // Connect global handler
  useEffect(() => {
    globalAlertHandler = showAlert;

    // Monkey-patch React Native's default Alert.alert so existing code everywhere automatically displays our custom popup
    const originalAlert = RNAlert.alert;
    (RNAlert as any).nativeAlert = originalAlert;

    RNAlert.alert = (title: string, message?: string, buttons?: any[], options?: any) => {
      const type = inferAlertType(title, message);

      const parsedButtons: AlertButton[] | undefined = buttons?.map((b) => ({
        text: b.text || 'OK',
        onPress: b.onPress,
        style: b.style,
      }));

      showAlert({
        title,
        message,
        type,
        buttons: parsedButtons,
        dismissable: options?.cancelable ?? true,
      });
    };

    return () => {
      globalAlertHandler = null;
      // Restore original alert on unmount
      RNAlert.alert = originalAlert;
    };
  }, [showAlert]);

  const showSuccess = useCallback(
    (title: string, message?: string, onPress?: () => void) => {
      showAlert({
        title,
        message,
        type: 'success',
        buttons: [{ text: 'Great!', onPress }],
      });
    },
    [showAlert]
  );

  const showError = useCallback(
    (title: string, message?: string, onPress?: () => void) => {
      showAlert({
        title,
        message,
        type: 'error',
        buttons: [{ text: 'Understood', onPress }],
      });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (title: string, message?: string, onPress?: () => void) => {
      showAlert({
        title,
        message,
        type: 'warning',
        buttons: [{ text: 'Acknowledge', onPress }],
      });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (title: string, message?: string, onPress?: () => void) => {
      showAlert({
        title,
        message,
        type: 'info',
        buttons: [{ text: 'OK', onPress }],
      });
    },
    [showAlert]
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm?: () => void,
      onCancel?: () => void,
      confirmText: string = 'Confirm',
      cancelText: string = 'Cancel'
    ) => {
      showAlert({
        title,
        message,
        type: 'info',
        buttons: [
          { text: cancelText, style: 'cancel', onPress: onCancel },
          { text: confirmText, style: 'default', onPress: onConfirm },
        ],
      });
    },
    [showAlert]
  );

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        hideAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
      }}
    >
      {children}
      <CustomAlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        badgeText={alertState.badgeText}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
        dismissable={alertState.dismissable}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
