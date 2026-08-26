"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const [query, setQuery] = useState(currentSearch);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal input state if URL searchParam changes (e.g. back button)
  useEffect(() => {
    setQuery(currentSearch);
  }, [currentSearch]);

  function updateSearch(term: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = term.trim();

    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }
    // Always reset to page 1 when search term changes
    params.delete("page");

    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextVal = e.target.value;
    setQuery(nextVal);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateSearch(nextVal);
    }, 300);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      updateSearch(query);
    }
  }

  function handleClear() {
    setQuery("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    updateSearch("");
  }

  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search links by title, url, site..."
        className="pr-8 font-mono text-xs"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-fog hover:text-paper"
        >
          ✕
        </button>
      )}
      {isPending && (
        <span className="absolute right-8 top-1/2 -translate-y-1/2 font-mono text-[0.65rem] text-signal animate-pulse">
          searching…
        </span>
      )}
    </div>
  );
}
