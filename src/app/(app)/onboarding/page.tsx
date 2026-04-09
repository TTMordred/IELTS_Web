"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const bandOptions = [
  { value: "", label: "Select target band" },
  { value: "4.0", label: "4.0" },
  { value: "4.5", label: "4.5" },
  { value: "5.0", label: "5.0" },
  { value: "5.5", label: "5.5" },
  { value: "6.0", label: "6.0" },
  { value: "6.5", label: "6.5" },
  { value: "7.0", label: "7.0" },
  { value: "7.5", label: "7.5" },
  { value: "8.0", label: "8.0" },
  { value: "8.5", label: "8.5" },
  { value: "9.0", label: "9.0" },
];

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState("");
  const [targetBand, setTargetBand] = useState("");
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          target_band: targetBand ? parseFloat(targetBand) : null,
          exam_date: examDate || null,
          last_active: new Date().toISOString().split("T")[0],
        })
        .eq("id", user.id);

      if (updateError) throw updateError;
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-body)] px-4">
      <div className="card-base w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)] flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg font-bold">I</span>
          </div>
          <h1 className="heading-lg">Setup Profile</h1>
          <p className="text-[var(--color-ink-secondary)] text-sm mt-2">
            Tell us about your IELTS goals
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should we call you?"
            required
          />

          <Select
            label="Target Band"
            value={targetBand}
            onChange={(e) => setTargetBand(e.target.value)}
            helperText="What band score are you aiming for?"
          >
            {bandOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Input
            label="Exam Date (optional)"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            helperText="When is your IELTS exam? Leave blank if undecided."
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
            Get Started
          </Button>
        </form>
      </div>
    </div>
  );
}
