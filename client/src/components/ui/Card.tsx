import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({
  children,
  hoverable = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-line bg-panel p-4 transition-all duration-150 ${
        hoverable
          ? "hover:-translate-y-[1px] hover:border-[#33405c] hover:bg-[#141a26]"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}