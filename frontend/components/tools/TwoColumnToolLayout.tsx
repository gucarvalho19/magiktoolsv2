import React from 'react';

interface TwoColumnToolLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  disclaimer?: React.ReactNode;
  warningMessage?: {
    text: string;
    type: 'warning' | 'error' | 'info';
  };
  leftColumn: React.ReactNode; // Formulário/configuração
  rightColumn: React.ReactNode; // Resultado/preview
}

export default function TwoColumnToolLayout({
  title,
  description,
  icon,
  disclaimer,
  warningMessage,
  leftColumn,
  rightColumn
}: TwoColumnToolLayoutProps) {
  const getWarningStyles = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
    }
  };

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🚫';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          {icon}
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>
        
        <p className="text-muted-foreground">{description}</p>

        {/* Disclaimer */}
        {disclaimer && (
          <div>
            {disclaimer}
          </div>
        )}

        {/* Warning/Info Message */}
        {warningMessage && (
          <div className={`border rounded-lg p-4 ${getWarningStyles(warningMessage.type)}`}>
            <div className="flex items-start space-x-3">
              <div className="text-lg">{getWarningIcon(warningMessage.type)}</div>
              <div className="text-sm" dangerouslySetInnerHTML={{ __html: warningMessage.text }} />
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input/Configuration */}
        <div className="space-y-4">
          {leftColumn}
        </div>

        {/* Right Column - Results/Preview */}
        <div className="space-y-4">
          {rightColumn}
        </div>
      </div>
    </div>
  );
}