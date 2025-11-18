import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', hover = true, onClick, style }: CardProps) {
  const hoverStyles = hover 
    ? "hover:translate-y-[-2px] hover:shadow-[0_8px_24px_var(--shadow-color)] cursor-pointer transition-transform duration-200 ease-out" 
    : "";

  const baseClasses = `
    bg-[var(--glass-bg)]
    backdrop-blur-[12px]
    saturate-[120%]
    [-webkit-backdrop-filter:blur(12px)_saturate(120%)]
    rounded-[var(--radius-2xl)]
    shadow-[0_2px_8px_var(--shadow-color)] md:shadow-[var(--shadow-md)]
    border
    border-[var(--glass-border)]
    p-4 md:p-6
    relative
    ${hoverStyles}
    ${className}
  `;

  // Use semantic button when interactive
  if (onClick) {
    return (
      <button 
        type="button"
        onClick={onClick}
        className={`${baseClasses} text-left w-full`}
        style={style}
      >
        {children}
      </button>
    );
  }

  // Use div for non-interactive cards
  return (
    <div className={baseClasses} style={style}>
      {children}
    </div>
  );
}


