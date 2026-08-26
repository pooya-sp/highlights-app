import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-display rounded-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-[0.5px]";

  const variantStyles = {
    primary:
      "bg-signal text-white font-medium hover:bg-[#6388ff]",
    ghost:
      "border border-line text-fog hover:border-[#344059] hover:text-paper hover:bg-panel-2",
    danger:
      "border border-line text-fog hover:border-danger/40 hover:text-danger hover:bg-danger/10",
  };

  const sizeStyles = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-sm",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}