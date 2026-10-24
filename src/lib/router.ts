// Tiny URL router (no dependencies).
// The app lives under /app so every page has a real, shareable path:
//   /                     → landing page
//   /app                  → dashboard
//   /app/projects         → project list
//   /app/projects/<key>   → project detail (phases, tasks, subtasks)
//   /app/mytasks | /app/checklist | /app/tasks | /app/activity | /app/settings
//   /app/crm[/<tab>]      → CRM pipeline / contacts / companies / activity
//   /app/setup            → setup wizard (modal)
import type { ViewName } from "./types";

export const APP_ROOT = "/app";

export type CrmTab = "pipeline" | "contacts" | "companies" | "activity";
export const CRM_TABS: CrmTab[] = ["pipeline", "contacts", "companies", "activity"];

export interface Route {
  landing: boolean;
  view: ViewName;
  projectKey?: string;
  crmTab?: CrmTab;
  setup?: boolean;
}

/** Read the current URL. Unknown paths fall back to the dashboard. */
export function parseRoute(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const at = clean.indexOf(APP_ROOT);
  if (at === -1) {
    return { landing: clean === "/", view: "dashboard" };
  }

  const rest = clean.slice(at + APP_ROOT.length).replace(/^\/+/, "");
  if (!rest) return { landing: false, view: "dashboard" };

  const [head, ...tail] = rest.split("/");
  const tailPath = tail.filter(Boolean).join("/");

  switch (head) {
    case "projects":
      return tailPath
        ? { landing: false, view: "project", projectKey: decodeURIComponent(tailPath) }
        : { landing: false, view: "projects" };
    case "mytasks":
      return { landing: false, view: "mytasks" };
    case "checklist":
      return { landing: false, view: "checklist" };
    case "tasks":
      return { landing: false, view: "tasks" };
    case "activity":
      return { landing: false, view: "activity" };
    case "settings":
      return { landing: false, view: "settings" };
    case "setup":
      return { landing: false, view: "dashboard", setup: true };
    case "crm": {
      const tab = CRM_TABS.includes(tailPath as CrmTab) ? (tailPath as CrmTab) : "pipeline";
      return { landing: false, view: "crm", crmTab: tab };
    }
    default:
      return { landing: false, view: "dashboard" };
  }
}

/** Path for a view / project / CRM tab. */
export function routePath(view: ViewName, projectKey?: string | null, crmTab?: CrmTab): string {
  switch (view) {
    case "projects":
      return `${APP_ROOT}/projects`;
    case "project":
      return projectKey ? `${APP_ROOT}/projects/${encodeURIComponent(projectKey)}` : `${APP_ROOT}/projects`;
    case "mytasks":
      return `${APP_ROOT}/mytasks`;
    case "checklist":
      return `${APP_ROOT}/checklist`;
    case "tasks":
      return `${APP_ROOT}/tasks`;
    case "activity":
      return `${APP_ROOT}/activity`;
    case "settings":
      return `${APP_ROOT}/settings`;
    case "crm":
      return crmTab && crmTab !== "pipeline" ? `${APP_ROOT}/crm/${crmTab}` : `${APP_ROOT}/crm`;
    case "wizard":
      return `${APP_ROOT}/setup`;
    case "dashboard":
    default:
      return APP_ROOT;
  }
}

export const LANDING_PATH = "/";

/** Push a path without adding duplicate history entries. */
export function pushPath(path: string, replace = false): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname + window.location.search === path) return;
  try {
    if (replace) window.history.replaceState({}, "", path);
    else window.history.pushState({}, "", path);
  } catch {
    // history can throw in sandboxed iframes — the app still works, the URL
    // simply won't change.
  }
}

export function currentRoute(): Route {
  if (typeof window === "undefined") return { landing: true, view: "dashboard" };
  return parseRoute(window.location.pathname);
}
