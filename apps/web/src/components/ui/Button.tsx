import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-sky-700 hover:bg-sky-800 text-white shadow-sm focus:ring-sky-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs focus:ring-slate-400',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white shadow-sm focus:ring-rose-500',
    outline: 'border-2 border-sky-700 text-sky-800 hover:bg-sky-50 focus:ring-sky-500',
    gold: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm focus:ring-amber-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
