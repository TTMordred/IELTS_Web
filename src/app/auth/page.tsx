"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, GraduationCap, BookOpen, Target } from "lucide-react";
import Image from "next/image";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://langhub.mordred.site"
    : "http://localhost:3000");

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
      <div className="flex min-h-screen items-center justify-center px-4 auth-hero-bg">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a14]/90 via-[#0F1117]/85 to-[#1B4D3E]/70" />
        </div>
        <div className="relative z-10 card-base w-full max-w-sm p-8 text-center space-y-4 backdrop-blur-sm bg-[var(--color-card)]/95">
          <div className="w-14 h-14 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 text-[var(--color-accent)]" />
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
    <div className="flex min-h-screen">
      {/* Left panel — hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80&auto=format&fit=crop"
          alt="Study desk with books and notes"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a14]/85 via-[#0F1117]/70 to-[#1B4D3E]/60" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 z-10">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Your IELTS journey<br />starts here.
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              Track progress, practice smarter, and achieve your target band score with data-driven insights.
            </p>
            <div className="flex gap-6 pt-2">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <GraduationCap className="w-4 h-4" />
                <span>Smart Practice</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <BookOpen className="w-4 h-4" />
                <span>All 4 Skills</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Target className="w-4 h-4" />
                <span>Band Tracking</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative dot pattern */}
        <div className="absolute top-8 right-8 w-32 h-32 z-10 opacity-20" style={{
          backgroundImage: "radial-gradient(circle, rgba(74,222,128,0.5) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }} />
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 relative">
        {/* Mobile background image */}
        <div className="lg:hidden absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a14]/90 via-[#0F1117]/85 to-[#1B4D3E]/70" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="card-base p-8 backdrop-blur-sm bg-[var(--color-card)]/95 lg:bg-[var(--color-card)]">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)] flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
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
