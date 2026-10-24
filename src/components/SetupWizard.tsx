import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { getRegistry, saveRegistry } from "../lib/storage";

export default function SetupWizard() {
  const { wizardOpen, closeWizard, setView, refreshKey, config, updateConfig } = useApp();
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState("");
  const [scanResult, setScanResult] = useState<{ dir: string; created: number; loaded: number } | null>(null);
  const [scanInfo, setScanInfo] = useState("");
  const [scanError, setScanError] = useState(false);
  const companyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wizardOpen) {
      setCompany(config.company || "");
      setScanResult(null);
      setScanInfo("");
      setScanError(false);
      if (config.company && config.company !== "JRiSpace") {
        setStep(2);
      } else {
        setStep(1);
      }
    }
  }, [wizardOpen]);

  useEffect(() => {
    if (wizardOpen && step === 2 && companyRef.current) {
      companyRef.current.focus();
      companyRef.current.select();
    }
  }, [wizardOpen, step]);

  const finishWizard = () => {
    updateConfig({
      ...config,
      company: company || config.company,
      launched: true,
    });
    setStep(4);
  };

  const handleScan = async () => {
    if (!(window as any).showDirectoryPicker) {
      setScanInfo("Folder scanning needs Chrome/Edge — you can skip this step.");
      setScanError(true);
      return;
    }
    setScanInfo("Scanning...");
    setScanError(false);
    try {
      const dir = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      let created = 0;
      let loaded = 0;
      const registry = getRegistry();
      for await (const sub of dir.values()) {
        if (sub.kind !== "directory") continue;
        const key = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (!registry.projects.find((p: any) => p.key === key)) {
          registry.projects.push({ key, name: sub.name });
          created++;
        }
        try {
          for await (const f of sub.values()) {
            if (f.kind !== "file") continue;
            const name = String(f.name || "");
            if (name === "checklist.json" || name.indexOf("jrispace-checklist") === 0) {
              const file = await f.getFile();
              const text = await file.text();
              const data = JSON.parse(text);
              if (data && Array.isArray(data.phases)) {
                data.project = sub.name;
                localStorage.setItem(`jrispace.checklist.v2.${key}`, JSON.stringify(data));
                loaded++;
              }
              break;
            }
          }
        } catch (err) {}
      }
      registry.folder = dir.name;
      saveRegistry(registry);
      setScanResult({ dir: dir.name, created, loaded });
      setScanInfo(`${created} new project(s), ${loaded} checklist(s) imported.`);
    } catch (err) {
      setScanInfo("No folder selected.");
      setScanError(true);
    }
  };

  if (!wizardOpen) return null;

  return (
    <div className="modal-overlay show">
      <div className="modal wizard-modal">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div>
            <h3>🚀 Welcome to Local Projects Manager</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
              This wizard will help you set up your workspace.
            </p>
            <div className="m-actions">
              <button onClick={closeWizard} className="ghost">Skip</button>
              <button onClick={() => setStep(2)} className="primary">Get Started</button>
            </div>
          </div>
        )}

        {/* Step 2: Brand */}
        {step === 2 && (
          <div>
            <h3>⚙️ Brand Your Workspace</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
              Enter your company or project name. This will appear throughout the app.
            </p>
            <label style={{ fontSize: 12.5, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Company / Project Name
            </label>
            <input
              ref={companyRef}
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. JRiSpace"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setStep(3); } }}
              style={{ width: "100%", marginBottom: 12 }}
            />
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Preview: <strong>{company || "JRiSpace"}</strong>
            </div>
            <div className="m-actions">
              <button onClick={() => setStep(1)} className="ghost">Back</button>
              <button onClick={() => setStep(3)} className="primary">Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Scan Folder */}
        {step === 3 && (
          <div>
            <h3>📁 Scan Project Folder</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
              Connect a folder to import your existing projects. Each subfolder becomes a project.
            </p>
            <div style={{ fontSize: 13, marginBottom: 12 }}>
              Root: <strong>{scanResult?.dir || getRegistry().folder || "~/Projects"}</strong>
            </div>
            {scanInfo && (
              <div className={`wiz-root-info ${scanError ? "err" : ""}`} style={{ marginBottom: 12 }}>
                {scanInfo}
              </div>
            )}
            <div className="m-actions">
              <button onClick={() => setStep(2)} className="ghost">Back</button>
              <button onClick={handleScan} className="primary">Scan Folder</button>
              <button onClick={finishWizard} className="ghost">Continue</button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div>
            <h3>✅ Setup Complete</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
              {company
                ? `Your workspace is now branded as "${company}".`
                : 'Kept "JRiSpace" as your company name.'}
            </p>
            <div className="m-actions">
              <button onClick={() => { closeWizard(); setView("dashboard"); }} className="primary">Done</button>
            </div>
          </div>
        )}

        {/* Dots */}
        <div className="wiz-dots" style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`wiz-dot ${step === n ? "on" : ""}`}
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: step === n ? "var(--accent)" : "var(--border-primary)",
                transition: "background 0.2s"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
