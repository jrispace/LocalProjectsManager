// Dark / Light / Auto theme manager
export type Theme = "dark" | "light" | "auto";

const STORAGE_KEY = "lpm-theme";

let currentTheme: Theme = "dark";

export function getTheme(): Theme {
  return currentTheme;
}

export function setTheme(theme: Theme): void {
  currentTheme = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  applyTheme();
}

export function initTheme(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && ["dark", "light", "auto"].includes(saved)) {
      currentTheme = saved;
    }
  } catch {}
  applyTheme();

  // Listen for system preference changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (currentTheme === "auto") applyTheme();
  });
}

function applyTheme(): void {
  const isDark = currentTheme === "auto"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : currentTheme === "dark";

  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  document.documentElement.classList.toggle("theme-dark", isDark);
  document.documentElement.classList.toggle("theme-light", !isDark);
}

export function cycleTheme(): Theme {
  const themes: Theme[] = ["dark", "light", "auto"];
  const idx = themes.indexOf(currentTheme);
  const next = themes[(idx + 1) % themes.length];
  setTheme(next);
  return next;
}

export function getThemeLabel(theme: Theme): string {
  switch (theme) {
    case "dark": return "Dark";
    case "light": return "Light";
    case "auto": return "Auto";
  }
}
