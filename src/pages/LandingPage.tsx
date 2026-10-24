import { useState, useEffect } from "react";

const REPO = "jrispace/LocalProjectsManager";

export default function LandingPage({ onOpenApp }: { onOpenApp: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "hidden"; };
  }, []);
  const [dlStatus, setDlStatus] = useState("Click the button — it fetches the latest release from GitHub and downloads the zip. You are never redirected away.");
  const [dlClass, setDlClass] = useState("");
  const [dlDisabled, setDlDisabled] = useState(false);
  const [relVersion, setRelVersion] = useState("—");
  const [relDate, setRelDate] = useState("—");
  const [relSize, setRelSize] = useState("—");

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then((r) => (r.ok ? r.json() : null))
      .then((rel) => {
        if (!rel) return;
        const asset = rel.assets?.find((a: any) => /\.zip$/i.test(a.name));
        setRelVersion(rel.tag_name || "—");
        setRelDate((rel.published_at || "").slice(0, 10));
        setRelSize(asset ? fmt(asset.size) : "—");
      })
      .catch(() => {});
  }, []);

  function fmt(bytes: number) {
    if (!bytes) return "—";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    let b = bytes;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return b.toFixed(i ? 1 : 0) + " " + u[i];
  }

  function downloadApp() {
    if (dlDisabled) return;
    setDlDisabled(true);
    setDlStatus("⬇️ Fetching latest release…");
    setDlClass("");
    const a = document.createElement("a");
    a.href = `https://github.com/${REPO}/releases/latest/download/LocalProjectsManager.zip`;
    a.download = "LocalProjectsManager.zip";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setDlStatus("✅ Download started — check your Downloads folder. The latest version is always fetched.");
    setDlClass("ok");
    setTimeout(() => setDlDisabled(false), 2500);
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', background: "#f5f8ff", color: "#1a2433", lineHeight: 1.55, minHeight: "100vh", height: "100%", overflow: "auto" }}>
      <style>{`
        .landing-hero { background: linear-gradient(135deg, #0141c2 0%, #0b63f6 55%, #38bdf8 100%); color: #fff; padding: 72px 0 64px; text-align: center; }
        .landing-wrap { max-width: 980px; margin: 0 auto; padding: 0 22px; }
        .landing-logo { display: inline-flex; align-items: center; gap: 12px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.25); backdrop-filter: blur(6px); border-radius: 14px; padding: 10px 18px; font-size: 15px; font-weight: 800; letter-spacing: .4px; margin-bottom: 22px; }
        .landing-hero h1 { font-size: 44px; font-weight: 900; letter-spacing: -.5px; margin-bottom: 14px; }
        .landing-hero p.tag { font-size: 18px; color: rgba(255,255,255,.92); max-width: 640px; margin: 0 auto 30px; }
        .landing-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .landing-btn { display: inline-flex; align-items: center; gap: 9px; font: inherit; font-weight: 800; font-size: 15.5px; padding: 14px 26px; border-radius: 12px; cursor: pointer; text-decoration: none; transition: transform .12s ease, box-shadow .12s ease; }
        .landing-btn:hover { transform: translateY(-2px); }
        .landing-btn-primary { background: #fff; color: #0141c2; border: none; box-shadow: 0 8px 24px rgba(0,0,0,.22); }
        .landing-btn-primary:hover { box-shadow: 0 12px 30px rgba(0,0,0,.3); }
        .landing-btn-ghost { background: rgba(255,255,255,.12); color: #fff; border: 1px solid rgba(255,255,255,.4); }
        .landing-btn-ghost:hover { background: rgba(255,255,255,.2); }
        .landing-btn:disabled { opacity: .65; cursor: wait; transform: none; }
        .landing-dl-status { margin-top: 18px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,.95); min-height: 22px; }
        .landing-dl-status.ok { color: #bbf7d0; }
        .landing-dl-status.err { color: #fecaca; }
        .landing-section { padding: 52px 0; }
        .landing-section.alt { background: #fff; border-top: 1px solid #dbe3f0; border-bottom: 1px solid #dbe3f0; }
        .landing-section h2 { font-size: 27px; font-weight: 850; letter-spacing: -.3px; margin-bottom: 10px; color: #1a2433; }
        .landing-section h2 .em { color: #0b63f6; }
        .landing-section .sub { color: #5c6b82; font-size: 15.5px; max-width: 700px; margin-bottom: 28px; }
        .landing-privacy { display: flex; gap: 16px; align-items: flex-start; background: #fff; border: 1px solid rgba(13, 148, 136, .35); border-left: 5px solid #0d9488; border-radius: 14px; padding: 20px 22px; margin-bottom: 34px; box-shadow: 0 4px 16px rgba(13, 148, 136, .08); }
        .landing-privacy .ico { font-size: 30px; line-height: 1; }
        .landing-privacy h3 { font-size: 16.5px; margin-bottom: 4px; color: #0f766e; }
        .landing-privacy p { font-size: 14.5px; color: #5c6b82; }
        .landing-privacy p b { color: #1a2433; }
        .landing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px; }
        .landing-card { background: #fff; border: 1px solid #dbe3f0; border-radius: 14px; padding: 20px; box-shadow: 0 2px 10px rgba(1, 65, 194, .05); }
        .landing-card .ico { font-size: 26px; margin-bottom: 10px; }
        .landing-card h4 { font-size: 15.5px; margin-bottom: 6px; }
        .landing-card p { font-size: 13.5px; color: #5c6b82; }
        .landing-steps { counter-reset: st; list-style: none; display: grid; gap: 14px; }
        .landing-steps li { counter-increment: st; display: flex; gap: 16px; align-items: flex-start; background: #fff; border: 1px solid #dbe3f0; border-radius: 12px; padding: 16px 18px; }
        .landing-steps li::before { content: counter(st); flex: 0 0 34px; height: 34px; border-radius: 50%; background: #0b63f6; color: #fff; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; }
        .landing-steps b { display: block; margin-bottom: 2px; }
        .landing-steps span { font-size: 14px; color: #5c6b82; }
        .landing-steps code { background: #e8f0fe; color: #0141c2; padding: 2px 7px; border-radius: 6px; font-size: 13px; font-weight: 600; }
        .landing-rel-info { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 8px; }
        .landing-rel-info div { background: #fff; border: 1px solid #dbe3f0; border-radius: 12px; padding: 14px 18px; font-size: 13.5px; }
        .landing-rel-info b { display: block; font-size: 17px; color: #0141c2; }
        .landing-footer { background: #0b1220; color: rgba(255,255,255,.75); padding: 34px 0 40px; font-size: 13.5px; text-align: center; }
        .landing-footer b { color: #fff; }
        .landing-footer a { color: #7dd3fc; text-decoration: none; }
      `}</style>

      {/* Hero */}
      <div className="landing-hero">
        <div className="landing-wrap">
          <div className="landing-logo"><img src={`${import.meta.env.BASE_URL}icons/lpm-logo.png`} alt="LPM" style={{ height: 40, verticalAlign: "middle" }} /> LOCAL PROJECTS MANAGER</div>
          <h1>Your projects. Your machine. <br />Nothing leaves your computer.</h1>
          <p className="tag">A 100% local project manager — track every project, phase and task with a live dashboard, progress reports and a real database file on your disk. Works like a native app on your phone. No account, no server, no tracking.</p>
          <div className="landing-btns">
            <button className="landing-btn landing-btn-primary" onClick={downloadApp} disabled={dlDisabled}>⬇️ Download App (.zip)</button>
            <button className="landing-btn landing-btn-ghost" onClick={onOpenApp}>🚀 Open App locally</button>
          </div>
          <div className={`landing-dl-status ${dlClass}`}>{dlStatus}</div>
        </div>
      </div>

      {/* Privacy + Features */}
      <div className="landing-section">
        <div className="landing-wrap">
          <div className="landing-privacy">
            <div className="ico">🔒</div>
            <div>
              <h3>Your data stays on your machine — 100%</h3>
              <p><b>We do not have access to your data.</b> LocalProjectsManager runs entirely in your browser, storing everything in a <b>local database file on your disk</b> (<code style={{ background: "#e8f0fe", color: "#0141c2", padding: "2px 7px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>jrispace-pm.db</code>) plus a browser cache. There is <b>no server, no cloud sync, no analytics, no accounts</b> — click <b>💾 Connect DB</b>, pick a folder, and every change is written to disk automatically. Even if you clear your browser cache, your projects survive.</p>
            </div>
          </div>

          <h2>Everything a project manager should be — <span className="em">without the cloud</span></h2>
          <p className="sub">Designed by <b>Sylvenson Richard</b> for <b>JRiSpace</b>, the app works offline, instantly, and never phones home.</p>

          <div className="landing-grid">
            <div className="landing-card"><div className="ico">💾</div><h4>Local disk database</h4><p>One tap on <b>Connect DB</b> writes every change to a real file on your machine — survives clearing your browser cache.</p></div>
            <div className="landing-card"><div className="ico">🗂</div><h4>List ⇄ Board</h4><p>Every project flips between a phase list and an Asana-style Kanban board with drag &amp; drop, assignees, comments and "blocked by" links.</p></div>
            <div className="landing-card"><div className="ico">💰</div><h4>CRM pipeline</h4><p>Companies, contacts and deals through Lead → Qualified → Proposal → Negotiation → Won, with a weighted forecast and an activity timeline.</p></div>
            <div className="landing-card"><div className="ico">🎯</div><h4>My Tasks</h4><p>Everything assigned to you across every project, grouped by overdue, today, next 7 days and later.</p></div>
            <div className="landing-card"><div className="ico">📁</div><h4>Projects become folders</h4><p>"+ New" creates a real folder for each project with its <code style={{ background: "#e8f0fe", color: "#0141c2", padding: "2px 5px", borderRadius: 4, fontSize: 12 }}>checklist.json</code> inside — scan the parent folder and everything comes back.</p></div>
            <div className="landing-card"><div className="ico">📱</div><h4>Real mobile app feel</h4><p>Bottom navigation bar, slide-in menu drawer and touch-friendly controls — it behaves like a native app on your phone.</p></div>
            <div className="landing-card"><div className="ico">📊</div><h4>Live Dashboard</h4><p>Overall completion, progress per project, donut charts and KPI cards — updated the second you tick a task.</p></div>
            <div className="landing-card"><div className="ico">📋</div><h4>Task side sheet</h4><p>Tap any task for full details — who created it, when, scope, status — plus sub-tasks you can add, tick and track.</p></div>
            <div className="landing-card"><div className="ico">⟳</div><h4>Profile verify</h4><p>Verify any project against its known template: missing tasks are added, completed work is marked done — nothing is ever deleted.</p></div>
            <div className="landing-card"><div className="ico">🎨</div><h4>Branded in 30s</h4><p>Setup wizard lets you name the workspace after your company — the whole UI follows.</p></div>
            <div className="landing-card"><div className="ico">🔄</div><h4>Scan folder</h4><p>Connect a root folder and every subfolder becomes a project. Checklist files are imported automatically.</p></div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="landing-section alt">
        <div className="landing-wrap">
          <h2>How the app works</h2>
          <p className="sub">Three steps to full project control — no installation required.</p>

          <ol className="landing-steps">
            <li>
              <div>
                <b>Download & unzip</b>
                <span>Click <b>⬇️ Download App</b> above — the zip is fetched from the latest GitHub release and saved to your <b>Downloads</b> folder. Unzip it anywhere (double-click in Finder).</span>
              </div>
            </li>
            <li>
              <div>
                <b>Open the app</b>
                <span>Double-click <code>lpm.command</code> — it opens the app in your browser and keeps it running locally. No install, no dependencies. (You can also use <b>🚀 Open App locally</b> above.)</span>
              </div>
            </li>
            <li>
              <div>
                <b>Scan your projects</b>
                <span>Click <b>Scan folder</b> and pick <code>~/Projects</code> — every subfolder becomes a project. Or click <b>+ New</b> to create one with a real folder on disk.</span>
              </div>
            </li>
            <li>
              <div>
                <b>Connect your database</b>
                <span>Click <b>💾 Connect DB</b> (same folder is fine) — the app creates <code>jrispace-pm.db</code> and saves every change to it automatically.</span>
              </div>
            </li>
          </ol>

          <h2 style={{ marginTop: 44 }}>Getting the latest update</h2>
          <p className="sub">The download button always fetches the <b>latest release</b> from GitHub — click it any time and you get the newest version.</p>
          <div className="landing-rel-info">
            <div><b>{relVersion}</b>Latest version</div>
            <div><b>{relDate}</b>Released</div>
            <div><b>{relSize}</b>Zip size</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <div className="landing-wrap">
          <b>LocalProjectsManager</b> — Project management that respects your privacy.<br />
          Build: JRiSpace (<a href="https://jrispace.com">jrispace.com</a>) · Author: <b>Sylvenson Richard</b> · Open source on <a href="https://github.com/jrispace/LocalProjectsManager">GitHub</a>
        </div>
      </div>
    </div>
  );
}
