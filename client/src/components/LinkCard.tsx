import Link from "next/link";
import type { Link as LinkType } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { LinkActions } from "@/components/dashboard/LinkActions";

interface LinkCardProps {
  link: LinkType;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export function LinkCard({ link }: LinkCardProps) {
  const hostname = (() => {
    try {
      return new URL(link.url).hostname.replace(/^www\./, "");
    } catch {
      return link.url;
    }
  })();

  const title =
    link.title || hostname || link.url.slice(0, 60) || "Untitled link";
  const description =
    link.description ||
    (link.status === "dead" ? "This link is not reachable right now." : null);

  const tags = link.tags ?? [];

  return (
    <Card hoverable className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {/* Preview image */}
      <div className="h-28 w-full shrink-0 overflow-hidden rounded-lg border border-line bg-panel-2 sm:h-24 sm:w-36">
        {link.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-fog/60">
              no preview
            </span>
          </div>
        )}
      </div>

      {/* Text block */}
      <div className="min-w-0 flex-1">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-base font-medium leading-snug text-paper transition-colors hover:text-signal"
        >
          {title}
        </a>
        {description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-fog">
            {description}
          </p>
        )}
        <p className="mt-2 truncate font-mono text-xs text-fog/70">
          {link.siteName ? `${link.siteName} · ` : ""}
          {hostname}
        </p>

        {/* Tag pills */}
        {tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 font-mono text-[0.68rem]">
            {tags.map((t) => (
              <Link
                key={t}
                href={`/dashboard?tag=${encodeURIComponent(t)}`}
                className="rounded border border-line bg-panel-2/60 px-1.5 py-0.5 text-fog hover:border-signal/50 hover:text-signal transition-colors"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Status + Actions */}
      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
        <StatusChip status={link.status} />
        <span className="font-mono text-[0.68rem] text-fog/60">
          {relativeTime(link.lastCheckedAt)}
        </span>
        <LinkActions linkId={link._id} isChecking={link.status === "checking"} />
      </div>
    </Card>
  );
}
