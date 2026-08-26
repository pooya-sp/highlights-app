import Link from "next/link";

interface TagFilterBarProps {
  tags: string[];
  activeTag?: string;
  activeFilter?: string;
  search?: string;
}

export function TagFilterBar({
  tags,
  activeTag,
  activeFilter = "all",
  search,
}: TagFilterBarProps) {
  // Defensive: drop any null/undefined/non-string entries and normalize
  const safeTags = (tags ?? []).filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0
  );

  const currentTag = activeTag ?? "all";

  if (safeTags.length === 0) return null;

  const buildQuery = (tag: string) => {
    const params = new URLSearchParams();
    if (activeFilter && activeFilter !== "all")
      params.set("filter", activeFilter);
    if (search) params.set("search", search);
    if (tag && tag !== "all") params.set("tag", tag);
    return `/dashboard?${params.toString()}`;
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 font-mono text-xs">
      <span className="mr-1 text-[0.68rem] uppercase tracking-wider text-fog/60">
        Tags:
      </span>

      <Link
        href={buildQuery("all")}
        className={`rounded-full border px-2.5 py-0.5 transition-colors ${
          currentTag === "all"
            ? "border-signal bg-signal/15 text-signal font-semibold"
            : "border-line text-fog hover:border-[#344059] hover:text-paper"
        }`}
      >
        all
      </Link>

      {safeTags.map((t) => {
        const isActive = currentTag.toLowerCase() === t.toLowerCase();
        return (
          <Link
            key={t}
            href={buildQuery(t)}
            className={`rounded-full border px-2.5 py-0.5 transition-colors ${
              isActive
                ? "border-signal bg-signal/15 text-signal font-semibold"
                : "border-line text-fog hover:border-[#344059] hover:text-paper"
            }`}
          >
            #{t}
          </Link>
        );
      })}
    </div>
  );
}
