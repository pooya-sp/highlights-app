import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Link as LinkType } from "@/lib/types";
import { AddLinkForm } from "@/components/dashboard/AddLinkForm";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { CounterStrip, type Filter } from "@/components/dashboard/CounterStrip";
import { TagFilterBar } from "@/components/dashboard/TagFilterBar";
import { LinkCard } from "@/components/LinkCard";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    filter?: string;
    search?: string;
    tag?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("hl_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page ?? "1", 10) || 1);
  const activeFilter = (resolvedParams.filter as Filter) || "all";
  const searchTerm = resolvedParams.search?.trim() || "";
  const activeTag = resolvedParams.tag?.trim() || "all";

  let links: LinkType[] = [];
  let totalFiltered = 0;
  let pages = 1;
  let counts = { total: 0, ok: 0, dead: 0 };
  let allTags: string[] = [];
  let fetchError: string | null = null;

  try {
    const res = await api.getLinks(
      token,
      page,
      10,
      activeFilter,
      searchTerm,
      activeTag,
    );
    links = res.data.links;
    totalFiltered = res.data.pagination.total;
    pages = res.data.pagination.pages;
    counts = res.data.counts;
    allTags = res.data.tags ?? [];
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load links";
  }

  // Build pagination query string preserving all active filters
  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set("page", targetPage.toString());
    if (activeFilter !== "all") params.set("filter", activeFilter);
    if (searchTerm) params.set("search", searchTerm);
    if (activeTag !== "all") params.set("tag", activeTag);
    return `/dashboard?${params.toString()}`;
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 -mx-6 mb-10 border-b border-line bg-ink/90 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-signal" />
            <span className="font-display text-base font-medium tracking-tight text-paper">
              Highlights
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Add Link Form */}
      <AddLinkForm />

      {/* Counter Strip (real global counts + server filter) */}
      <div className="mb-6">
        <CounterStrip
          total={counts.total}
          ok={counts.ok}
          dead={counts.dead}
          activeFilter={activeFilter}
          search={searchTerm}
        />
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchInput />
      </div>

      {/* Tag Filter Bar */}
      <TagFilterBar
        tags={allTags}
        activeTag={activeTag}
        activeFilter={activeFilter}
        search={searchTerm}
      />

      {fetchError ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {fetchError}
        </div>
      ) : links.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-lg text-paper">
            {searchTerm
              ? `No links matching "${searchTerm}"`
              : activeTag !== "all"
                ? `No links tagged with #${activeTag}`
                : activeFilter === "all"
                  ? "Your shelf is empty."
                  : `No ${activeFilter} links found.`}
          </p>
          <p className="mt-1 text-sm text-fog">
            {searchTerm
              ? "Try searching for a different keyword or domain."
              : activeTag !== "all"
                ? "Try clearing the tag filter."
                : activeFilter === "all"
                  ? "Paste a link above to save your first one."
                  : "Try selecting a different filter above."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <LinkCard key={link._id} link={link} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-10 flex items-center justify-between border-t border-line pt-5 font-mono text-xs">
          {page > 1 ? (
            <Link
              href={buildPageUrl(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-fog transition-colors hover:border-[#344059] hover:text-paper"
            >
              ← prev
            </Link>
          ) : (
            <span className="cursor-not-allowed text-fog/30">← prev</span>
          )}

          <span className="text-fog">
            page {page} / {pages}
          </span>

          {page < pages ? (
            <Link
              href={buildPageUrl(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-fog transition-colors hover:border-[#344059] hover:text-paper"
            >
              next →
            </Link>
          ) : (
            <span className="cursor-not-allowed text-fog/30">next →</span>
          )}
        </div>
      )}
    </main>
  );
}
