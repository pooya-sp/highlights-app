"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    null
  );

  return (
    <div className="relative w-full max-w-sm">
      <div className="mb-8 flex items-center justify-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-signal" />
        <span className="font-display text-lg font-medium tracking-tight text-paper">
          Highlights
        </span>
      </div>

      <Card className="p-7">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-paper">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-fog">Your own shelf starts here.</p>

        <form action={formAction} className="mt-6 space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />

          {state?.error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-fog">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-signal hover:text-signal/80"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
