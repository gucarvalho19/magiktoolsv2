import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  className?: string;
  height?: string;
}

export default function Logo({ className = '', height = '40px' }: LogoProps) {
  const { theme } = useTheme();
  
  const logoSrc = theme === 'dark'
    ? '/assets/logo/logo-colorida.png'
    : '/assets/logo/logo-colorida-preto.png';

  return (
    <img
      src={logoSrc}
      alt="MagikTools"
      className={className}
      style={{
        height,
        objectFit: 'contain',
        transition: 'opacity 0.3s ease-in-out',
      }}
      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const fallback = document.createElement('span');
        fallback.textContent = 'MagikTools';
        fallback.className = 'font-bold text-lg';
        target.parentElement?.appendChild(fallback);
      }}
    />
  );
}
