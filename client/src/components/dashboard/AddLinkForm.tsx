"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createLinkAction } from "@/app/actions/links";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AddLinkForm() {
  const [state, formAction, isPending] = useActionState(
    createLinkAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setShowTags(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="mb-8 rounded-xl border border-line bg-panel p-4">
      <form ref={formRef} action={formAction} className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="text"
            name="url"
            placeholder="Paste a link to save it (e.g. google.com or https://...)"
            required
            className="font-mono text-sm"
          />
          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="shrink-0"
          >
            {isPending ? "Checking…" : "Save link"}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowTags(!showTags)}
            className="font-mono text-xs text-fog hover:text-signal transition-colors"
          >
            {showTags ? "− Hide tags" : "+ Add tags (optional)"}
          </button>
        </div>

        {showTags && (
          <div>
            <Input
              type="text"
              name="tags"
              placeholder="e.g. tech, design, ai (comma-separated)"
              className="font-mono text-xs"
            />
          </div>
        )}
      </form>

      {state?.error && (
        <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
    </div>
  );
}
