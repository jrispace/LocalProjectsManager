// Keyboard shortcuts manager
import type { ViewName } from "./types";

type ShortcutHandler = () => void;

const shortcuts: Map<string, ShortcutHandler> = new Map();
let enabled = true;

function key(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("mod");
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");
  parts.push(e.key.toLowerCase());
  return parts.join("+");
}

export function registerShortcut(combo: string, handler: ShortcutHandler): void {
  shortcuts.set(combo.toLowerCase(), handler);
}

export function unregisterShortcut(combo: string): void {
  shortcuts.delete(combo.toLowerCase());
}

export function enableShortcuts(): void {
  enabled = true;
}

export function disableShortcuts(): void {
  enabled = false;
}

function handler(e: KeyboardEvent): void {
  if (!enabled) return;
  // Ignore if focused on input/textarea
  const tag = (e.target as HTMLElement).tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

  const combo = key(e);
  const fn = shortcuts.get(combo);
  if (fn) {
    e.preventDefault();
    fn();
  }
}

export function setupDefaultShortcuts(navigate: (view: ViewName) => void): void {
  const go = (view: ViewName) => () => navigate(view);

  registerShortcut("mod+1", go("dashboard"));
  registerShortcut("mod+2", go("projects"));
  registerShortcut("mod+3", go("checklist"));
  registerShortcut("mod+4", go("tasks"));
  registerShortcut("mod+5", go("activity"));
  registerShortcut("mod+6", go("settings"));

  // Close modals with Escape
  registerShortcut("escape", () => {
    document.dispatchEvent(new CustomEvent("close-modal"));
  });
}

export function initKeyboardShortcuts(navigate: (view: ViewName) => void): () => void {
  setupDefaultShortcuts(navigate);
  document.addEventListener("keydown", handler);
  return () => {
    document.removeEventListener("keydown", handler);
    shortcuts.clear();
  };
}
