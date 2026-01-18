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
    primary: "bg-primary text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700",
    secondary: "bg-secondary text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600",
    outline: "border-2 border-primary text-primary hover:bg-indigo-50",
    ghost: "text-gray-600 hover:bg-gray-100"
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
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`} {...props}>
    {title && (
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
      </div>
    )}
    <div className="p-5">
      {children}
    </div>
  </div>
);

export const MarkdownText: React.FC<{ content: string }> = ({ content }) => {
  // Simple markdown-to-html replacement for list items and bold text
  // In a real app, use a library like react-markdown
  const processText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/## (.*?)\n/g, '<h3 class="text-xl font-bold mt-4 mb-2 text-primary">$1</h3>')
      .replace(/- (.*?)\n/g, '<li class="ml-4 list-disc text-gray-700 mb-1">$1</li>')
      .replace(/\n/g, '<br/>');
  };

  return <div className="prose prose-indigo max-w-none" dangerouslySetInnerHTML={{ __html: processText(content) }} />;
};

export const Header: React.FC<{ title: string; onBack?: () => void; onHome?: () => void }> = ({ title, onBack, onHome }) => (
  <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between no-print">
    <div className="flex items-center gap-2">
      {onBack && (
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-800 truncate">{title}</h1>
    </div>
    {onHome && (
      <button onClick={onHome} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
        <Home className="h-6 w-6" />
      </button>
    )}
  </header>
);