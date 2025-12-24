import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const toastStyles = {
    success: {
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: CheckCircle,
    },
    error: {
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: AlertCircle,
    },
    info: {
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: Info,
    },
    warning: {
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      icon: AlertTriangle,
    },
  };

  const { bgColor, iconColor, icon: Icon } = toastStyles[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-75 max-w-md">
        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <p className="flex-1 text-sm text-gray-900 wrap-break-word">{message}</p>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}