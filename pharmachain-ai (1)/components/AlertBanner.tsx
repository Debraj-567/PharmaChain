import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

type AlertType = 'success' | 'warning' | 'error' | 'info';

interface AlertBannerProps {
  type: AlertType;
  title: string;
  message: string;
  className?: string;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ type, title, message, className = '' }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className={`border rounded-md p-4 flex gap-3 ${styles[type]} ${className}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-sm opacity-90">{message}</p>
      </div>
    </div>
  );
};

export default AlertBanner;
