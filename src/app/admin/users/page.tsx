import { checkIsAdmin } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Link from "next/link";

export default async function AdminUsersPage() {
  await checkIsAdmin();

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, target_band, current_streak, total_xp, last_active, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Users className="w-6 h-6 text-[var(--color-accent)]" />
          All Users
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          {(profiles || []).length} registered users
        </p>
      </div>

      <div className="card-base overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface-hover)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-secondary)]">Name</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-secondary)]">Target</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-secondary)]">Streak</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-secondary)]">XP</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-secondary)]">Last Active</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-secondary)]">Role</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-secondary)]"></th>
            </tr>
          </thead>
          <tbody>
            {(profiles || []).map((p) => (
              <tr key={p.id} className="border-b border-[var(--color-line)] hover:bg-[var(--color-surface-hover)] transition-colors">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/users/${p.id}`} className="text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors cursor-pointer">{p.display_name || "—"}</Link>
                </td>
                <td className="px-4 py-3 font-mono text-[var(--color-ink-secondary)]">{p.target_band || "—"}</td>
                <td className="px-4 py-3 font-mono text-[var(--color-ink-secondary)]">{p.current_streak}d</td>
                <td className="px-4 py-3 font-mono text-[var(--color-ink-secondary)]">{p.total_xp}</td>
                <td className="px-4 py-3 text-[var(--color-ink-muted)]">{p.last_active || "Never"}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.role === "admin" ? "purple" : "default"}>{p.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${p.id}`} className="text-xs text-[var(--color-accent)] hover:underline cursor-pointer">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
