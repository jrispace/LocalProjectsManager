import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type { ViewName, ToastMsg, Config, ProjectData, ToastKind, Lang } from "../lib/types";
import { getConfig, saveConfig, getProjectData } from "../lib/storage";
import { setLang as setLangFn, getLang } from "../lib/i18n";
import { setTheme as setThemeFn, getTheme, initTheme, type Theme } from "../lib/theme";
import { initTabSync, notifyOtherTabs, cleanupTabSync } from "../lib/tabsync";
import { initKeyboardShortcuts } from "../lib/shortcuts";
import { connectDisk } from "../lib/diskdb";
import { currentRoute, pushPath, routePath, LANDING_PATH, APP_ROOT } from "../lib/router";

interface UndoAction {
  label: string;
  fn: () => void;
}

interface AppCtx {
  // ── Routing ─────────────────────────────────────
  landing: boolean;
  openApp: () => void;
  goToLanding: () => void;

  // ── View state ──────────────────────────────────
  view: ViewName;
  setView: (v: ViewName) => void;
  selectedProject: string | null;
  selectProject: (key: string | null) => void;

  // ── Config ──────────────────────────────────────
  config: Config;
  updateConfig: (c: Partial<Config>) => void;

  // ── Theme ───────────────────────────────────────
  theme: Theme;
  setTheme: (t: Theme) => void;

  // ── Language ────────────────────────────────────
  lang: Lang;
  setLang: (l: Lang) => void;

  // ── Toasts ──────────────────────────────────────
  toasts: ToastMsg[];
  showToast: (text: string, kind?: ToastKind, undoFn?: () => void) => void;
  dismissToast: (id: number) => void;

  // ── Undo ────────────────────────────────────────
  undoStack: UndoAction[];
  pushUndo: (a: UndoAction) => void;
  popUndo: () => UndoAction | undefined;

  // ── Mobile drawer ───────────────────────────────
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;

  // ── Modal ───────────────────────────────────────
  modalOpen: boolean;
  setModalOpen: (v: boolean) => void;

  // ── Confirm dialog ──────────────────────────────
  confirmOpen: boolean;
  confirmMsg: string;
  confirmFn: (() => void) | null;
  askConfirm: (msg: string, fn: () => void) => void;
  closeConfirm: () => void;

  // ── Refresh trigger ─────────────────────────────
  refreshKey: number;
  refresh: () => void;

  // ── Get project data helper ─────────────────────
  getProject: (key: string) => ProjectData | null;

  // ── Setup wizard ────────────────────────────────
  wizardOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
}

const AppContext = createContext<AppCtx | null>(null);

let toastId = 0;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialRoute = useRef(currentRoute()).current;
  const [landing, setLanding] = useState(initialRoute.landing);
  const [view, setView] = useState<ViewName>(initialRoute.view);
  const [selectedProject, setSelectedProject] = useState<string | null>(initialRoute.projectKey ?? null);
  const [config, setConfig] = useState<Config>(() => getConfig());
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [lang, setLangState] = useState<Lang>(() => getLang());
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmFn, setConfirmFn] = useState<(() => void) | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(!!initialRoute.setup);
  const undoStackRef = useRef<UndoAction[]>([]);

  // ── URL ⇄ state sync ─────────────────────────────
  // Every page owns a real path (/app, /app/projects/<key>, /app/crm/contacts…)
  // so it can be bookmarked, reloaded and shared, and the browser back button
  // walks through the app instead of leaving it.
  useEffect(() => {
    const onPop = () => {
      const route = currentRoute();
      setLanding(route.landing);
      setView(route.view);
      setSelectedProject(route.projectKey ?? null);
      setWizardOpen(!!route.setup);
      setDrawerOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    // The CRM owns its tab segment (/app/crm/contacts…), so don't rewrite it.
    if (view === "crm" && window.location.pathname.startsWith(`${APP_ROOT}/crm`)) return;
    const path = landing
      ? LANDING_PATH
      : wizardOpen
        ? routePath("wizard")
        : routePath(view, selectedProject);
    pushPath(path);
  }, [landing, view, selectedProject, wizardOpen]);

  // ── Init theme on mount ──────────────────────────
  useEffect(() => {
    initTheme();
  }, []);

  // ── Silent disk reconnect ────────────────────────
  // The disk database is where projects can survive a cache clear. Reopen it
  // on boot without prompting (the browser still may require a user gesture
  // for a stale handle — in that case the user reconnects from Settings).
  useEffect(() => {
    let cancelled = false;
    connectDisk({ silent: true })
      .then((ok) => {
        if (ok && !cancelled) setRefreshKey((k) => k + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Multi-tab sync ───────────────────────────────
  useEffect(() => {
    const cleanup = initTabSync(() => {
      refresh();
      showToast("Updated from another tab", "info");
    });
    return () => {
      cleanup();
      cleanupTabSync();
    };
  }, [refreshKey]);

  // ── Keyboard shortcuts ───────────────────────────
  useEffect(() => {
    const cleanup = initKeyboardShortcuts((v) => setView(v));
    return cleanup;
  }, []);

  const selectProject = useCallback((key: string | null) => {
    setSelectedProject(key);
    // A null key means "show the project list", not "open a project".
    setView(key ? "project" : "projects");
    setDrawerOpen(false);
  }, []);

  const openApp = useCallback(() => {
    setLanding(false);
    setView("dashboard");
    setSelectedProject(null);
  }, []);

  const goToLanding = useCallback(() => {
    setLanding(true);
    setWizardOpen(false);
  }, []);

  const updateConfig = useCallback((partial: Partial<Config>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      saveConfig(next);
      notifyOtherTabs();
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setThemeFn(t);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setLangFn(l);
    refresh();
  }, [refresh]);

  const showToast = useCallback((text: string, kind: ToastKind = "success", undoFn?: () => void) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, text, kind, undoFn }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushUndo = useCallback((a: UndoAction) => {
    undoStackRef.current.push(a);
  }, []);

  const popUndo = useCallback((): UndoAction | undefined => {
    return undoStackRef.current.pop();
  }, []);

  const getProject = useCallback((key: string): ProjectData | null => {
    return getProjectData(key);
  }, [refreshKey]);

  const askConfirm = useCallback((msg: string, fn: () => void) => {
    setConfirmMsg(msg);
    setConfirmFn(() => fn);
    setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setConfirmMsg("");
    setConfirmFn(null);
  }, []);

  const openWizard = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        landing,
        openApp,
        goToLanding,
        view,
        setView,
        selectedProject,
        selectProject,
        config,
        updateConfig,
        theme,
        setTheme,
        lang,
        setLang,
        toasts,
        showToast,
        dismissToast,
        undoStack: undoStackRef.current,
        pushUndo,
        popUndo,
        drawerOpen,
        setDrawerOpen,
        modalOpen,
        setModalOpen,
        confirmOpen,
        confirmMsg,
        confirmFn,
        askConfirm,
        closeConfirm,
        refreshKey,
        refresh,
        getProject,
        wizardOpen,
        openWizard,
        closeWizard,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppCtx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
