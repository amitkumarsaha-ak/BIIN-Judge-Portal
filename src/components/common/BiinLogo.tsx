import React from 'react';
import biinLogoSrc from '../../assets/BIIN.jpeg';

interface BiinLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showContainer?: boolean;
}

export const BiinLogo: React.FC<BiinLogoProps> = ({
  className = '',
  size = 'md',
  showContainer = true,
}) => {
  const containerClasses = {
    sm: 'h-9 px-1.5 py-1',
    md: 'h-11 px-2 py-1',
    lg: 'h-14 px-3 py-1.5',
  }[size];

  const imgClasses = {
    sm: 'h-7 max-h-7',
    md: 'h-8 max-h-8',
    lg: 'h-11 max-h-11',
  }[size];

  if (!showContainer) {
    return (
      <img
        src={biinLogoSrc}
        alt="BIIN - Bangladesh ICT and Innovation Network"
        className={`w-auto object-contain ${imgClasses} ${className}`}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 dark:border-slate-700/80 shrink-0 transition-transform group-hover:scale-105 ${containerClasses} ${className}`}
    >
      <img
        src={biinLogoSrc}
        alt="BIIN - Bangladesh ICT and Innovation Network"
        className={`w-auto object-contain ${imgClasses}`}
      />
    </div>
  );
};
