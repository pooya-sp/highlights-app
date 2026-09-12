"use client";

import { useEffect, useState } from "react";
import type { Link as LinkType } from "@/lib/types";
import { getLinks } from "@/lib/offline-db";
import { LinkCard } from "@/components/LinkCard";

// Shown inside the dashboard when the server render failed (offline).
// Reads the last successfully fetched links out of IndexedDB.
export function OfflineLinks({ fetchError }: { fetchError: string }) {
  const [links, setLinks] = useState<LinkType[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getLinks()
      .then((cached) => {
        if (!cancelled) setLinks(cached);
      })
      .catch(() => {
        if (!cancelled) setLinks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="mb-4 rounded-lg border border-pending/30 bg-pending/10 px-4 py-3 text-sm text-pending">
        {fetchError}
        {loading ? null : (
          <span className="block text-xs text-pending/80">
            Showing your cached links (offline mode).
          </span>
        )}
      </div>

      {loading ? (
        <p className="py-10 text-center font-mono text-xs text-fog">
          loading cached links…
        </p>
      ) : links && links.length > 0 ? (
        <div className="space-y-3">
          {links.map((link) => (
            <LinkCard key={link._id} link={link} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center font-display text-lg text-paper">
          No cached links available offline yet.
        </p>
      )}
    </>
  );
}

// Invisible component that mirrors each server-rendered page of links
// into IndexedDB, so the latest view is always available offline.
export function LinksCacheSync({ links }: { links: LinkType[] }) {
  useEffect(() => {
    if (links.length === 0) return;

    import("@/lib/offline-db")
      .then(({ saveLinks }) => saveLinks(links))
      .catch(() => {
        // caching is best-effort; never break the page over it
      });
  }, [links]);

  return null;
}
