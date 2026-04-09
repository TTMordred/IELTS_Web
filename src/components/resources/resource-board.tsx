"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { addResource, deleteResource, incrementUsage } from "@/app/(app)/resources/actions";
import { Plus, Trash2, ExternalLink, Search, X, Star, Globe } from "lucide-react";

type Resource = {
  id: string;
  url: string;
  title: string;
  module: string;
  difficulty: string;
  tags: string[];
  rating: number | null;
  notes: string | null;
  usage_count: number;
  is_public: boolean;
  created_at: string;
};

const MODULE_OPTIONS = [
  { value: "all", label: "All Modules" },
  { value: "listening", label: "Listening" },
  { value: "reading", label: "Reading" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
  { value: "general", label: "General" },
];

const MODULE_COLORS: Record<string, string> = {
  listening: "#378ADD",
  reading: "#D85A30",
  speaking: "#1D9E75",
  writing: "#993556",
  general: "var(--color-accent)",
};

export function ResourceBoard({ initialResources }: { initialResources: Resource[] }) {
  const [resources, setResources] = useState(initialResources);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [module, setModule] = useState("general");
  const [difficulty, setDifficulty] = useState("all");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const filtered = resources.filter((r) => {
    if (moduleFilter !== "all" && r.module !== moduleFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.url.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleAdd() {
    if (!url.trim() || !title.trim()) return;
    setLoading(true);
    try {
      await addResource({ url: url.trim(), title: title.trim(), module, difficulty, tags: [], notes: notes.trim(), is_public: isPublic });
      setResources((prev) => [{
        id: crypto.randomUUID(), url: url.trim(), title: title.trim(), module, difficulty,
        tags: [], rating: null, notes: notes.trim() || null, usage_count: 0, is_public: isPublic,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setUrl(""); setTitle(""); setNotes(""); setShowForm(false);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    setResources((prev) => prev.filter((r) => r.id !== id));
    try { await deleteResource(id); } catch (err) { console.error(err); }
  }

  async function handleOpen(r: Resource) {
    window.open(r.url, "_blank", "noopener,noreferrer");
    try { await incrementUsage(r.id); } catch { /* ignore */ }
    setResources((prev) => prev.map((res) => res.id === r.id ? { ...res, usage_count: res.usage_count + 1 } : res));
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
        </div>
        <div className="flex gap-1.5">
          {MODULE_OPTIONS.map((m) => (
            <button key={m.value} onClick={() => setModuleFilter(m.value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer ${
                moduleFilter === m.value ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                  : "border-[var(--color-line)] text-[var(--color-ink-secondary)]"}`}>
              {m.label}
            </button>
          ))}
        </div>
        <Button variant={showForm ? "secondary" : "primary"} size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Add Resource"}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card-base p-5 space-y-3 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-3">
            <Input label="URL" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource name" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Module" value={module} onChange={(e) => setModule(e.target.value)}>
              {MODULE_OPTIONS.filter((m) => m.value !== "all").map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
            <div className="flex items-end">
              <label className="flex items-center gap-2 py-2 cursor-pointer">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-line)]" />
                <span className="text-sm text-[var(--color-ink-secondary)]"><Globe className="w-3.5 h-3.5 inline" /> Public</span>
              </label>
            </div>
          </div>
          <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why is this useful?" />
          <div className="flex justify-end">
            <Button onClick={handleAdd} variant="primary" loading={loading}>Save Resource</Button>
          </div>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-[var(--color-ink-muted)]">{filtered.length} resources</p>

      {/* Resource Cards */}
      {filtered.length === 0 ? (
        <div className="card-base p-12 text-center">
          <p className="text-[var(--color-ink-muted)]">{search ? "No resources match" : "No resources yet. Save your first study link!"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="card-base p-4 group flex flex-col gap-2"
              style={{ borderTop: `3px solid ${MODULE_COLORS[r.module] || "var(--color-line)"}` }}>
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => handleOpen(r)}
                  className="text-left flex-1 cursor-pointer hover:text-[var(--color-accent)] transition-colors">
                  <p className="font-medium text-sm text-[var(--color-ink)] line-clamp-2">{r.title}</p>
                  <p className="text-xs text-[var(--color-ink-muted)] truncate mt-0.5">{r.url}</p>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleOpen(r)} className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] cursor-pointer">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(r.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-[var(--color-ink-muted)] hover:text-red-500 transition-all cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={r.module === "listening" ? "info" : r.module === "reading" ? "warning" : r.module === "speaking" ? "success" : "purple"}>
                  {r.module}
                </Badge>
                {r.difficulty !== "all" && <Badge variant="default">{r.difficulty}</Badge>}
                {r.is_public && <Globe className="w-3 h-3 text-[var(--color-ink-muted)]" />}
              </div>
              {r.notes && <p className="text-xs text-[var(--color-ink-secondary)] line-clamp-2">{r.notes}</p>}
              <div className="flex items-center gap-3 text-xs text-[var(--color-ink-muted)] mt-auto pt-1">
                <span>{r.usage_count}x opened</span>
                {r.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{r.rating}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
