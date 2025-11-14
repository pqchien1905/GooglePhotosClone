import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose?: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-400" />,
        error: <XCircle className="h-5 w-5 text-red-400" />,
        warning: <AlertCircle className="h-5 w-5 text-yellow-400" />,
        info: <Info className="h-5 w-5 text-blue-400" />,
    };

    const bgColors = {
        success: 'bg-gray-900 dark:bg-gray-800 border-green-500/20',
        error: 'bg-gray-900 dark:bg-gray-800 border-red-500/20',
        warning: 'bg-gray-900 dark:bg-gray-800 border-yellow-500/20',
        info: 'bg-gray-900 dark:bg-gray-800 border-blue-500/20',
    };

    if (!isVisible) return null;

    return (
        <div
            className={`pointer-events-auto fixed right-4 top-4 z-[60] max-w-sm animate-fade-in-up rounded-lg border ${bgColors[type]} px-4 py-3 text-sm font-normal text-white shadow-xl backdrop-blur-sm transition-all duration-300`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{icons[type]}</div>
                <div className="flex-1">
                    <p className="text-white">{message}</p>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => onClose?.(), 300);
                    }}
                    className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-white transition-colors"
                    aria-label="Đóng thông báo"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

