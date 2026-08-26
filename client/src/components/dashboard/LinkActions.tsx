"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLinkAction, recheckLinkAction } from "@/app/actions/links";
import { Button } from "@/components/ui/Button";

interface LinkActionsProps {
  linkId: string;
  isChecking?: boolean;
}

export function LinkActions({ linkId, isChecking = false }: LinkActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRecheck() {
    startTransition(async () => {
      await recheckLinkAction(linkId);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteLinkAction(linkId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleRecheck}
        disabled={isPending || isChecking}
        title="Re-check this link"
      >
        {isPending ? "…" : "↻"}
      </Button>

      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
        title="Delete this link"
      >
        {isPending ? "…" : "✕"}
      </Button>
    </div>
  );
}
