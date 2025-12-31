'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

// Types
type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'loading';

interface AlertOptions {
    title?: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
}

interface AlertState extends AlertOptions {
    isOpen: boolean;
    isLoading?: boolean;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showWarning: (message: string, title?: string) => void;
    showInfo: (message: string, title?: string) => void;
    showConfirm: (message: string, onConfirm: () => void | Promise<void>, title?: string) => void;
    showLoading: (message: string, title?: string) => void;
    hideAlert: () => void;
}

// Context
const AlertContext = createContext<AlertContextType | null>(null);

// Hook
export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}

// Icon component
function AlertIcon({ type }: { type: AlertType }) {
    switch (type) {
        case 'success':
            return <CheckCircle className="w-12 h-12 text-green-500" />;
        case 'error':
            return <XCircle className="w-12 h-12 text-red-500" />;
        case 'warning':
            return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
        case 'info':
            return <Info className="w-12 h-12 text-blue-500" />;
        case 'confirm':
            return <AlertTriangle className="w-12 h-12 text-orange-500" />;
        case 'loading':
            return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
        default:
            return <Info className="w-12 h-12 text-blue-500" />;
    }
}

// Default titles
const defaultTitles: Record<AlertType, string> = {
    success: 'สำเร็จ',
    error: 'เกิดข้อผิดพลาด',
    warning: 'คำเตือน',
    info: 'แจ้งเตือน',
    confirm: 'ยืนยัน',
    loading: 'กำลังดำเนินการ',
};

// Provider component
export function AlertProvider({ children }: { children: ReactNode }) {
    const [alert, setAlert] = useState<AlertState>({
        isOpen: false,
        message: '',
        type: 'info',
    });

    const showAlert = useCallback((options: AlertOptions) => {
        setAlert({
            ...options,
            isOpen: true,
            type: options.type || 'info',
            title: options.title || defaultTitles[options.type || 'info'],
        });
    }, []);

    const showSuccess = useCallback((message: string, title?: string) => {
        showAlert({ message, title, type: 'success' });
    }, [showAlert]);

    const showError = useCallback((message: string, title?: string) => {
        showAlert({ message, title, type: 'error' });
    }, [showAlert]);

    const showWarning = useCallback((message: string, title?: string) => {
        showAlert({ message, title, type: 'warning' });
    }, [showAlert]);

    const showInfo = useCallback((message: string, title?: string) => {
        showAlert({ message, title, type: 'info' });
    }, [showAlert]);

    const showConfirm = useCallback((
        message: string,
        onConfirm: () => void | Promise<void>,
        title?: string
    ) => {
        showAlert({
            message,
            title: title || 'ยืนยันการดำเนินการ',
            type: 'confirm',
            onConfirm,
            confirmText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
        });
    }, [showAlert]);

    const showLoading = useCallback((message: string, title?: string) => {
        showAlert({ message, title, type: 'loading' });
    }, [showAlert]);

    const hideAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirm = async () => {
        if (alert.onConfirm) {
            setAlert(prev => ({ ...prev, isLoading: true }));
            try {
                await alert.onConfirm();
            } finally {
                setAlert(prev => ({ ...prev, isLoading: false }));
            }
        }
        hideAlert();
    };

    const handleCancel = () => {
        if (alert.onCancel) {
            alert.onCancel();
        }
        hideAlert();
    };

    return (
        <AlertContext.Provider value={{
            showAlert,
            showSuccess,
            showError,
            showWarning,
            showInfo,
            showConfirm,
            showLoading,
            hideAlert,
        }}>
            {children}

            <AlertDialog open={alert.isOpen} onOpenChange={(open) => !open && hideAlert()}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader className="flex flex-col items-center gap-4">
                        <AlertIcon type={alert.type || 'info'} />
                        <AlertDialogTitle className="text-center text-xl">
                            {alert.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-base">
                            {alert.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                        {alert.type === 'confirm' ? (
                            <>
                                <AlertDialogCancel
                                    onClick={handleCancel}
                                    disabled={alert.isLoading}
                                    className="w-full sm:w-auto"
                                >
                                    {alert.cancelText || 'ยกเลิก'}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleConfirm}
                                    disabled={alert.isLoading}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                                >
                                    {alert.isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {alert.confirmText || 'ยืนยัน'}
                                </AlertDialogAction>
                            </>
                        ) : alert.type === 'loading' ? null : (
                            <AlertDialogAction
                                onClick={hideAlert}
                                className={`w-full sm:w-auto ${
                                    alert.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                                    alert.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                                    alert.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                    'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {alert.confirmText || 'ตกลง'}
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AlertContext.Provider>
    );
}

// Standalone modal component for pages that don't use context
interface StandaloneAlertProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<void>;
    showCancel?: boolean;
}

export function StandaloneAlert({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    confirmText,
    cancelText,
    onConfirm,
    showCancel = false,
}: StandaloneAlertProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        if (onConfirm) {
            setIsLoading(true);
            try {
                await onConfirm();
            } finally {
                setIsLoading(false);
            }
        }
        onClose();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader className="flex flex-col items-center gap-4">
                    <AlertIcon type={type} />
                    <AlertDialogTitle className="text-center text-xl">
                        {title || defaultTitles[type]}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-base">
                        {message}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                    {showCancel && (
                        <AlertDialogCancel
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            {cancelText || 'ยกเลิก'}
                        </AlertDialogCancel>
                    )}
                    {type !== 'loading' && (
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`w-full sm:w-auto ${
                                type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                                type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                                type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                type === 'confirm' ? 'bg-blue-600 hover:bg-blue-700' :
                                'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {confirmText || 'ตกลง'}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
