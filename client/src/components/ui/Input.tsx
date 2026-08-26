import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-fog"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-sm text-paper placeholder:text-fog/70 transition-colors focus:border-signal focus:shadow-[0_0_0_3px_rgba(79,124,255,0.18)] focus:outline-none ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 font-mono text-xs text-danger">{error}</p>
      )}
    </div>
  );
}