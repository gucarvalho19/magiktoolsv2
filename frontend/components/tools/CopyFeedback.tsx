import React from 'react';

interface CopyFeedbackProps {
  show: boolean;
}

export default function CopyFeedback({ show }: CopyFeedbackProps) {
  if (!show) return null;

  return (
    <div 
      className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[13px] px-3 py-1.5 rounded-md shadow-lg pointer-events-none"
      style={{
        animation: 'copyFadeInOut 1.7s ease-in-out forwards',
      }}
      role="status"
      aria-live="polite"
    >
      Copiado!
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes copyFadeInOut {
            0% {
              opacity: 0;
              transform: translate(-50%, 5px);
            }
            11.76% {
              opacity: 1;
              transform: translate(-50%, 0);
            }
            88.24% {
              opacity: 1;
              transform: translate(-50%, 0);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -5px);
            }
          }
        `
      }} />
    </div>
  );
}
