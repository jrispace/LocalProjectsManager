import React, { useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import MobileDrawer from "./components/MobileDrawer";
import Toast from "./components/Toast";
import SetupWizard from "./components/SetupWizard";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Checklist from "./pages/Checklist";
import Tasks from "./pages/Tasks";
import MyTasks from "./pages/MyTasks";
import Crm from "./pages/Crm";
import ActivityLog from "./pages/ActivityLog";
import Settings from "./pages/Settings";

function AppContent() {
  const { view, theme, landing, openApp, drawerOpen, confirmOpen, confirmMsg, confirmFn, closeConfirm } = useApp();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  if (landing) {
    return <LandingPage onOpenApp={openApp} />;
  }

  const renderPage = () => {
    switch (view) {
      case "dashboard": return <Dashboard />;
      case "projects": return <Projects />;
      case "project": return <ProjectDetail />;
      case "checklist": return <Checklist />;
      case "tasks": return <Tasks />;
      case "mytasks": return <MyTasks />;
      case "crm": return <Crm />;
      case "activity": return <ActivityLog />;
      case "settings": return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-shell aurora-bg">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      {drawerOpen && <MobileDrawer />}

      {/* Main content */}
      <div className="main-content">
        <Header />
        <main className="main-content-inner">
          {renderPage()}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Toast */}
      <Toast />

      {/* Setup wizard */}
      <SetupWizard />

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="confirm-overlay">
          <div className="confirm-dialog animate-scale-in">
            <div className="confirm-title">{confirmMsg}</div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-secondary flex-1" onClick={closeConfirm}>
                Cancel
              </button>
              <button className="btn btn-danger flex-1" onClick={() => { confirmFn?.(); closeConfirm(); }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
