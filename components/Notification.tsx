import React, { useEffect } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface NotificationProps {
  notification: {
    message: string;
    type: 'success' | 'error';
  } | null;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div
      className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down
        ${isSuccess ? 'bg-lime-500' : 'bg-red-600'} text-white border ${isSuccess ? 'border-lime-600' : 'border-red-500'}`}
    >
      {isSuccess ? (
        <CheckCircleIcon className="w-6 h-6" />
      ) : (
        <ExclamationTriangleIcon className="w-6 h-6" />
      )}
      <span className="font-semibold">{notification.message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-slate-200">&times;</button>
       <style>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Notification;