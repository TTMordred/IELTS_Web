"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://langhub.mordred.site";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Show error from callback redirect (e.g. expired link)
  const callbackError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: `${SITE_URL}/auth/callback`,
          },
        });
        if (error) throw error;
        setSignedUp(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (signedUp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-body)] px-4">
        <div className="card-base w-full max-w-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mx-auto text-2xl">
            ✉️
          </div>
          <h2 className="heading-md">Check your email</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <button
            type="button"
            onClick={() => { setSignedUp(false); setIsLogin(true); }}
            className="text-sm text-[var(--color-accent)] hover:underline cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-body)] px-4">
      <div className="card-base w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <h1 className="heading-lg">
            IELTS <span className="text-accent">Hub</span>
          </h1>
          <p className="text-[var(--color-ink-secondary)] text-sm mt-2">
            {isLogin ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {callbackError === "confirmation_failed" && (
          <p className="text-sm text-[var(--color-critical)] bg-red-500/10 rounded-md px-3 py-2 mb-4">
            Confirmation link is invalid or expired. Please sign up again.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
          />

          {error && (
            <p className="text-sm text-[var(--color-critical)] bg-red-500/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            {isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
