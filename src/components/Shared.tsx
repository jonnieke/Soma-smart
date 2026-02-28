import React, { ReactNode } from 'react';
import { Loader2, ArrowLeft, Home } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  className = '',
  icon,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg";

  const variants = {
    primary: "bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 hover:bg-indigo-700 dark:hover:bg-indigo-400",
    secondary: "bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 hover:bg-emerald-600 dark:hover:bg-emerald-400",
    outline: "border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
    ghost: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${widthClass} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : icon}
      {children}
    </button>
  );
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, ...props }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden ${className}`} {...props}>
    {title && (
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{title}</h3>
      </div>
    )}
    <div className="p-5">
      {children}
    </div>
  </div>
);

import ReactMarkdown from 'react-markdown';

// ...

export const MarkdownText: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-indigo dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:text-indigo-900 dark:prose-headings:text-indigo-400 prose-strong:text-indigo-800 dark:prose-strong:text-indigo-300 text-sm md:text-base">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export const Header: React.FC<{ title: string; onBack?: () => void; onHome?: () => void }> = ({ title, onBack, onHome }) => (
  <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between no-print">
    <div className="flex items-center gap-2">
      {onBack && (
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">{title} items-center</h1>
    </div>
    {onHome && (
      <button onClick={onHome} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
        <Home className="h-6 w-6" />
      </button>
    )}
  </header>
);