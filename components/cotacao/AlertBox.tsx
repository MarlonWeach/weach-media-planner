/**
 * Componente: AlertBox
 * 
 * Exibe alertas e avisos de governança de preços
 */

'use client';

export type AlertType = 'error' | 'warning' | 'info' | 'success';

interface AlertBoxProps {
  type: AlertType;
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export function AlertBox({ type, title, message, onDismiss }: AlertBoxProps) {
  const styles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-400',
      title: 'text-red-800',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-400',
      title: 'text-yellow-800',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-400',
      title: 'text-blue-800',
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: 'text-green-400',
      title: 'text-green-800',
    },
  };

  const icons = {
    error: '⚠️',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✓',
  };

  const style = styles[type];

  return (
    <div
      className={`border rounded-lg p-4 ${style.container} ${
        onDismiss ? 'pr-10' : ''
      } relative`}
      role="alert"
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          aria-label="Fechar"
        >
          ×
        </button>
      )}
      <div className="flex items-start">
        <span className={`text-xl mr-3 ${style.icon}`}>{icons[type]}</span>
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold mb-1 ${style.title}`}>{title}</h4>
          )}
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}

