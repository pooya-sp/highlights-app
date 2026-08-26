import Link from "next/link";
import type { LinkStatus } from "@/lib/types";

export type Filter = "all" | LinkStatus;

interface CounterStripProps {
  total: number;
  ok: number;
  dead: number;
  activeFilter: Filter;
  search?: string;
}

export function CounterStrip({
  total,
  ok,
  dead,
  activeFilter,
  search,
}: CounterStripProps) {
  const cells: { key: Filter; label: string; value: number }[] = [
    { key: "all", label: "saved", value: total },
    { key: "ok", label: "alive", value: ok },
    { key: "dead", label: "dead", value: dead },
  ];

  const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";

  return (
    <div className="grid grid-cols-3 rounded-xl border border-line bg-panel overflow-hidden">
      {cells.map((c, index) => {
        const isActive = activeFilter === c.key;
        return (
          <Link
            key={c.key}
            href={`/dashboard?filter=${c.key}${searchParam}`}
            className={`p-4 text-left transition-colors duration-150 ${
              index > 0 ? "border-l border-line" : ""
            } ${isActive ? "bg-panel-2" : "hover:bg-panel-2/50"}`}
          >
            <div
              className={`font-display text-2xl leading-tight transition-colors ${
                isActive ? "text-signal font-semibold" : "text-paper"
              }`}
            >
              {c.value}
            </div>
            <div className="mt-1 font-mono text-[0.68rem] uppercase tracking-wider text-fog">
              {c.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
