"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/actions/auth";
import { clearLinks } from "@/lib/offline-db";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await clearLinks();
          } catch {
            // best-effort; never block logout over cache cleanup
          }
          await logoutAction();
        })
      }
    >
      {isPending ? "Logging out…" : "Log out"}
    </Button>
  );
}
