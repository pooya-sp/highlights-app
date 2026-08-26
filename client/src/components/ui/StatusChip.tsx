import React from "react";
import type { LinkStatus } from "@/lib/types";

interface StatusChipProps {
  status: LinkStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const textStyles = {
    ok: "text-signal",
    dead: "text-danger",
    checking: "text-pending",
  };

  const dotStyles = {
    ok: "bg-signal shadow-[0_0_6px_rgba(79,124,255,0.6)]",
    dead: "bg-danger shadow-[0_0_6px_rgba(255,92,92,0.5)]",
    checking: "bg-pending animate-pulse",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wider ${textStyles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {status}
    </span>
  );
}