"use client";

import { useState } from "react";
import { createShareLink, deleteShareLink } from "@/app/(app)/settings/share-actions";
import type { ShareLink } from "@/app/(app)/settings/share-actions";
import { Copy, Trash2, Check, ExternalLink } from "lucide-react";

function formatExpiry(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Expired";
  if (diffDays === 1) return "Expires tomorrow";
  return `Expires in ${diffDays} days`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy link"
      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] transition-colors"
    >
      {copied ? (
        <Check className="w-4 h-4 text-[var(--color-low)]" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

export function ShareLinksClient({
  initialLinks,
}: {
  initialLinks: ShareLink[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  async function handleCreate() {
    setCreating(true);
    try {
      const newLink = await createShareLink();
      setLinks((prev) => [newLink, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Failed to create share link. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteShareLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete link. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const activeLinks = links.filter(
    (l) => new Date(l.expires_at) > new Date()
  );

  return (
    <div className="space-y-5">
      {/* Create button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="heading-sm">Active Share Links</p>
          <p className="text-sm text-[var(--color-ink-secondary)]">
            Each link gives read-only access to a snapshot of your progress.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create link"}
        </button>
      </div>

      {/* Links list */}
      {activeLinks.length === 0 ? (
        <div className="text-center py-10 text-[var(--color-ink-muted)] text-sm border border-dashed border-[var(--color-line)] rounded-[var(--radius-lg)]">
          No active share links. Create one to get started.
        </div>
      ) : (
        <ul className="space-y-3">
          {activeLinks.map((link) => {
            const url = `${origin}/share/${link.token}`;
            const expiry = formatExpiry(link.expires_at);
            const snapshot = link.view_config?.snapshot;

            return (
              <li
                key={link.id}
                className="bg-[var(--color-body)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-4 space-y-3"
              >
                {/* URL row */}
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-[var(--color-sidebar)] border border-[var(--color-line)] rounded-[var(--radius-sm)] px-3 py-1.5 text-[var(--color-ink-secondary)] truncate">
                    {url}
                  </code>
                  <CopyButton text={url} />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in new tab"
                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(link.id)}
                    disabled={deletingId === link.id}
                    title="Delete link"
                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-secondary)] hover:text-[var(--color-critical)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs text-[var(--color-ink-muted)]">
                  <span>
                    Created{" "}
                    {new Date(link.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span
                    className={
                      expiry === "Expired"
                        ? "text-[var(--color-critical)]"
                        : "text-[var(--color-ink-secondary)]"
                    }
                  >
                    {expiry}
                  </span>
                </div>

                {/* Snapshot preview */}
                {snapshot && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[var(--color-line-light)]">
                    {(["listening", "reading", "writing", "speaking"] as const).map(
                      (mod) => {
                        const avg = snapshot[`${mod}_avg` as keyof typeof snapshot] as number | null;
                        const count = snapshot[`${mod}_count` as keyof typeof snapshot] as number;
                        return (
                          <div key={mod} className="text-center">
                            <p className="text-xs text-[var(--color-ink-muted)] capitalize">
                              {mod}
                            </p>
                            <p className="text-sm font-semibold text-[var(--color-ink)]">
                              {avg !== null ? avg.toFixed(1) : "—"}
                            </p>
                            <p className="text-xs text-[var(--color-ink-muted)]">
                              {count} rec
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* What tutors see */}
      <div className="bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 rounded-[var(--radius-lg)] px-4 py-3">
        <p className="text-sm font-medium text-[var(--color-accent-text)] mb-1">
          What your tutor will see
        </p>
        <ul className="text-sm text-[var(--color-ink-secondary)] space-y-0.5 list-disc list-inside">
          <li>Your name, target band, and estimated overall band</li>
          <li>Average band score per module (Listening, Reading, Writing, Speaking)</li>
          <li>Number of practice records per module</li>
          <li>Current streak</li>
        </ul>
        <p className="text-xs text-[var(--color-ink-muted)] mt-2">
          This is a snapshot taken at link creation. Live data is not shared.
        </p>
      </div>
    </div>
  );
}
