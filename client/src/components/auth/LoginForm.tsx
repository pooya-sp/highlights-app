"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

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
          Log in
        </h1>
        <p className="mt-1 text-sm text-fog">Sign in to reach your shelf.</p>

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
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {state?.error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-fog">
        New here?{" "}
        <Link
          href="/register"
          className="font-medium text-signal hover:text-signal/80"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
