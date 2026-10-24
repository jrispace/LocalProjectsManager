import React from "react";
import { useApp } from "../context/AppContext";
import { isDiskConnected, getDiskFolder } from "../lib/diskdb";
import { t } from "../lib/i18n";

export default function SystemHealth() {
  const { refreshKey } = useApp();

  const storage = (() => {
    try { return !!localStorage.getItem("jrispace.projects.v2"); } catch { return false; }
  })();

  const diskDb = isDiskConnected();
  const diskFolder = getDiskFolder();
  const sw = "serviceWorker" in navigator;

  const items = [
    {
      label: "localStorage",
      ok: storage,
      detail: storage ? "Data present" : "Empty",
    },
    {
      label: "Local Disk DB",
      ok: diskDb,
      detail: diskDb ? diskFolder : "Not connected",
    },
    {
      label: "Service Worker",
      ok: sw,
      detail: sw ? "Supported" : "Not supported",
    },
  ];

  const allHealthy = items.every((i) => i.ok);
  const statusLabel = allHealthy ? t("health.healthy") : t("health.warning");
  const statusColor = allHealthy ? "#34d399" : "#fbbf24";

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{t("health.title")}</span>
        <span className="health-badge" style={{ color: statusColor, borderColor: statusColor }}>
          {statusLabel}
        </span>
      </div>
      <div className="health-list">
        {items.map((item) => (
          <div key={item.label} className="health-item">
            <span className={`health-dot ${item.ok ? "ok" : "fail"}`} />
            <span className="health-label">{item.label}</span>
            <span className="health-detail">{item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
