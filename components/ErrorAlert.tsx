
import React from 'react';
import { AlertTriangleIcon } from './Icons';

interface ErrorAlertProps {
  message: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <div
      className="bg-red-900/50 border-r-4 border-red-500 text-red-200 p-4 rounded-lg flex gap-4 animate-fade-in"
      role="alert"
    >
      <div className="text-red-400 flex-shrink-0">
        <AlertTriangleIcon />
      </div>
      <div>
        <p className="font-bold">خطا</p>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default ErrorAlert;
