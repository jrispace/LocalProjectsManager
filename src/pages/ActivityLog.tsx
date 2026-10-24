import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { getActivity } from "../lib/storage";
import { relativeTime } from "../lib/utils";
import { t } from "../lib/i18n";

export default function ActivityLog() {
  const { refreshKey } = useApp();
  const entries = useMemo(() => getActivity(), [refreshKey]);

  return (
    <div className="page active animate-fade-in">
      <div className="mb-4">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{t("activity.title")}</h2>
        <p className="text-sm text-muted">{entries.length} recent activities</p>
      </div>

      <div className="card">
        {entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">{t("activity.noActivity")}</div>
            <div className="empty-state-desc">{t("activity.startTracking")}</div>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div key={idx} className="activity-item">
              <div className={`activity-dot ${entry.type}`} />
              <div className="flex-1">
                <div className="activity-text">{entry.text}</div>
                <div className="activity-meta">{relativeTime(entry.time)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
