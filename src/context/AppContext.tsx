import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type { ViewName, ToastMsg, Config, ProjectData, ToastKind, Lang } from "../lib/types";
import { getConfig, saveConfig, getProjectData } from "../lib/storage";
import { setLang as setLangFn, getLang } from "../lib/i18n";
import { setTheme as setThemeFn, getTheme, initTheme, type Theme } from "../lib/theme";
import { initTabSync, notifyOtherTabs, cleanupTabSync } from "../lib/tabsync";
import { initKeyboardShortcuts } from "../lib/shortcuts";

interface UndoAction {
  label: string;
  fn: () => void;
}

interface AppCtx {
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
  const [view, setView] = useState<ViewName>("dashboard");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
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
  const [wizardOpen, setWizardOpen] = useState(false);
  const undoStackRef = useRef<UndoAction[]>([]);

  // ── Init theme on mount ──────────────────────────
  useEffect(() => {
    initTheme();
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
