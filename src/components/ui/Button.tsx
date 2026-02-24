import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center";

    const variants = {
        primary: "bg-brand-red hover:bg-brand-red/90 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
        outline: "border-2 border-brand-red text-brand-red hover:bg-brand-red/5 bg-transparent",
        ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        secondary: "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 shadow-sm"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </button>
    );
};
