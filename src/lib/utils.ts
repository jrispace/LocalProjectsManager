import type { Task, Phase, ProjectData, ActivityEntry } from "./types";

// ── HTML-safe helpers ─────────────────────────────────────
export function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// ── Slugify ───────────────────────────────────────────────
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// ── Date helpers ──────────────────────────────────────────
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDue(date: string): string {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function isOverdue(date: string): boolean {
  if (!date) return false;
  return date < todayStr();
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Stats ─────────────────────────────────────────────────
export function calcStats(phases: Phase[]) {
  let total = 0;
  let done = 0;
  let overdue = 0;
  const today = todayStr();

  for (const p of phases) {
    for (const t of p.tasks) {
      total++;
      if (t.done) done++;
      else if (t.dueDate && t.dueDate < today) overdue++;
    }
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, overdue, pct };
}

// ── Priority helpers ──────────────────────────────────────
export function priorityLabel(p?: string): string {
  if (p === "high") return "🔴 High";
  if (p === "med") return "🟠 Medium";
  if (p === "low") return "🟢 Low";
  return "⚪ None";
}

export function priorityColor(p?: string): string {
  if (p === "high") return "var(--red)";
  if (p === "med") return "var(--orange)";
  if (p === "low") return "var(--green)";
  return "var(--text-dim)";
}

// ── Activity text ─────────────────────────────────────────
export function activityText(a: ActivityEntry): string {
  return a.text;
}

// ── Progress ring helpers ─────────────────────────────────
export function donutDash(pct: number): string {
  const r = 54;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;
  return `${filled} ${c}`;
}
