(function () {
  "use strict";
  /* ── Safe DOM helpers ──────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function $$(id, method) { var el = $(id); if (el && el[method]) el[method](); }
  function $text(id, val) { var el = $(id); if (el) el.textContent = val; }
  function $html(id, val) { var el = $(id); if (el) el.innerHTML = val; }
  function $show(id) { var el = $(id); if (el) el.style.display = ''; }
  function $hide(id) { var el = $(id); if (el) el.style.display = 'none'; }
  function $val(id) { var el = $(id); return el ? el.value : ''; }
  function $on(id, evt, fn) { var el = $(id); if (el) el.addEventListener(evt, fn); }
  function $class(id, cls) { var el = $(id); if (el) return el.classList; return { add:function(){}, remove:function(){}, toggle:function(){}, contains:function(){return false;} }; }


  var STORAGE_REGISTRY = "jrispace.projects.v2";
  var STORAGE_CHECK = "jrispace.checklist.v2.";
  var LEGACY_KEY = "jrispace.checklist.v1";
  var STORAGE_ACTIVITY = "jrispace.activity.v1";

  /* ── Activity Log ─────────────────────────────────────────────────── */
  var activityLog = [];
  function loadActivityLog() {
    try {
      var raw = localStorage.getItem(STORAGE_ACTIVITY);
      activityLog = raw ? JSON.parse(raw) : [];
    } catch (e) { activityLog = []; }
  }
  function saveActivityLog() {
    try { localStorage.setItem(STORAGE_ACTIVITY, JSON.stringify(activityLog.slice(0, 500))); } catch (e) {}
  }
  function logActivity(type, text, projectName) {
    activityLog.unshift({
      type: type,
      text: text,
      project: projectName || "",
      time: new Date().toISOString()
    });
    if (activityLog.length > 500) activityLog.length = 500;
    saveActivityLog();
  }
  function timeAgo(iso) {
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
    return new Date(iso).toLocaleDateString();
  }
  loadActivityLog();

  /* ── Default template: shared phases used by every new project ─────── */
  var DEFAULT_PHASES = [
    { name: "Project Intake", desc: "Requirements gate — goal, audience, features, budget, timeline." },
    { name: "Plan & Architecture", desc: "Tech stack, system design, data model, technical decisions." },
    { name: "Design", desc: "Wireframes, branding, UI kit, responsive & accessible." },
    { name: "Build", desc: "Frontend, backend, integrations, core features." },
    { name: "Auth & Data", desc: "Authentication, database, storage, security rules." },
    { name: "Verify & QA", desc: "Build checks, automated tests, manual QA." },
    { name: "Deploy", desc: "Pipeline, production deploy, domain, monitoring." },
    { name: "Document & Report", desc: "Docs, changelog, final report." }
  ];

  /* Default checklist template (seeded on first run, usable by any project) */
  var DEFAULT_DATA = {
    project: null, /* replaced with project name */
    version: "1.0",
    updatedAt: null,
    phases: DEFAULT_PHASES.map(function (p) {
      var tasks = [];
      if (p.name === "Project Intake") {
        tasks = [
          { text: "Define primary business goal & success metrics", done: false },
          { text: "Identify target user / client audience", done: false },
          { text: "List must-have vs nice-to-have features", done: false },
          { text: "Confirm budget range & hosting choice", done: false },
          { text: "Record deadline / launch date", done: false },
          { text: "Record answers in the project plan (PRD)", done: false }
        ];
      } else if (p.name === "Plan & Architecture") {
        tasks = [
          { text: "Choose the technology stack", done: false },
          { text: "Document the system architecture", done: false },
          { text: "Design the data model", done: false },
          { text: "Write ADRs for major technical decisions", done: false }
        ];
      } else if (p.name === "Design") {
        tasks = [
          { text: "Create wireframes & mockups", done: false },
          { text: "Define branding (colors, typography, logo)", done: false },
          { text: "Build reusable UI components", done: false },
          { text: "Accessibility & responsive audit (WCAG)", done: false }
        ];
      } else if (p.name === "Build") {
        tasks = [
          { text: "Build the frontend", done: false },
          { text: "Build the backend / APIs", done: false },
          { text: "Integrate third-party services", done: false },
          { text: "Implement core features end-to-end", done: false }
        ];
      } else if (p.name === "Auth & Data") {
        tasks = [
          { text: "Set up user authentication", done: false },
          { text: "Configure the database", done: false },
          { text: "Set up file / media storage", done: false },
          { text: "Define security rules & permissions", done: false }
        ];
      } else if (p.name === "Verify & QA") {
        tasks = [
          { text: "Run a production build", done: false },
          { text: "Write & pass automated tests", done: false },
          { text: "Manual QA in the browser", done: false },
          { text: "Fix bugs & edge cases", done: false }
        ];
      } else if (p.name === "Deploy") {
        tasks = [
          { text: "Set up the deployment pipeline", done: false },
          { text: "Deploy to production", done: false },
          { text: "Configure domain & DNS", done: false },
          { text: "Verify the live site", done: false }
        ];
      } else {
        tasks = [
          { text: "Write project documentation", done: false },
          { text: "Create a changelog", done: false },
          { text: "Final report: what works, what was fixed, what needs attention", done: false }
        ];
      }
      return { name: p.name, desc: p.desc, tasks: tasks };
    })
  };

  /* ── Project profiles: verified task lists for known projects ─────────
     Lè yon pwojè matche yon profile, sync la ajoute phases/tasks ki
     manke (pa doublon) epi mark done sa ki fèt — san efase sa user te fè. */
  var PROJECT_PROFILES = {
    gloryplatform: {
      match: /glory\s*platform/i,
      desc: "Glory Platform — JRiSpace educational ecosystem (verified against repo, 2026-08)",
      phases: [
        { name: "Project Intake", desc: "Requirements gate — goal, audience, features, budget, timeline.", tasks: [
          { text: "Define primary business goal & success metrics", done: true },
          { text: "Identify target user / client audience", done: true },
          { text: "List must-have vs nice-to-have features", done: true },
          { text: "Confirm budget range & hosting choice", done: true },
          { text: "Record deadline / launch date", done: true },
          { text: "Record answers in the project plan (PRD)", done: true }
        ]},
        { name: "Plan & Architecture", desc: "Tech stack, system design, data model, technical decisions.", tasks: [
          { text: "Choose the technology stack", done: true },
          { text: "Document the system architecture", done: true },
          { text: "Design the data model", done: true },
          { text: "Write ADRs for major technical decisions", done: true }
        ]},
        { name: "Design", desc: "Wireframes, branding, UI kit, responsive & accessible.", tasks: [
          { text: "Create wireframes & mockups", done: false },
          { text: "Define branding (colors, typography, logo)", done: true },
          { text: "Build reusable UI components", done: true },
          { text: "Accessibility & responsive audit (WCAG)", done: false }
        ]},
        { name: "Build", desc: "Frontend, backend, integrations, core features.", tasks: [
          { text: "Build the frontend", done: true },
          { text: "Build the backend / APIs", done: true },
          { text: "Integrate third-party services", done: true },
          { text: "Implement core features end-to-end", done: true }
        ]},
        { name: "Auth & Data", desc: "Authentication, database, storage, security rules.", tasks: [
          { text: "Set up user authentication", done: true },
          { text: "Configure the database", done: true },
          { text: "Set up file / media storage", done: false },
          { text: "Define security rules & permissions", done: true }
        ]},
        { name: "Verify & QA", desc: "Build checks, automated tests, manual QA.", tasks: [
          { text: "Run a production build", done: true },
          { text: "Write & pass automated tests", done: false },
          { text: "Manual QA in the browser", done: true },
          { text: "Fix bugs & edge cases", done: true }
        ]},
        { name: "Deploy", desc: "Pipeline, production deploy, domain, monitoring.", tasks: [
          { text: "Set up the deployment pipeline", done: true },
          { text: "Deploy to production", done: true },
          { text: "Configure domain & DNS", done: true },
          { text: "Verify the live site", done: true }
        ]},
        { name: "Document & Report", desc: "Docs, changelog, final report.", tasks: [
          { text: "Write project documentation", done: true },
          { text: "Create a changelog", done: false },
          { text: "Final report: what works, what was fixed, what needs attention", done: false }
        ]}
      ]
    }
  };

  /* Aplike profile yon pwojè: ajoute phases/tasks manke + mark done.
     done:true nan profile a se "verifye fèt" — li marke done si task la
     egziste deja men pa done, epi li pa dekoche janm yon task done. */
  function syncProjectProfile(p) {
    if (!p || !p.name || !p.data || !Array.isArray(p.data.phases)) return 0;
    var prof = null;
    Object.keys(PROJECT_PROFILES).forEach(function (k) {
      if (!prof && PROJECT_PROFILES[k].match.test(p.name)) prof = PROJECT_PROFILES[k];
    });
    if (!prof) return 0;

    var added = 0, marked = 0, now = new Date().toISOString();
    prof.phases.forEach(function (pp) {
      var phase = null;
      for (var i = 0; i < p.data.phases.length; i++) {
        if (String(p.data.phases[i].name || "").trim().toLowerCase() === String(pp.name || "").trim().toLowerCase()) {
          phase = p.data.phases[i]; break;
        }
      }
      if (!phase) {
        phase = { name: pp.name, desc: pp.desc || "", tasks: [], _open: true };
        p.data.phases.push(phase);
      }
      if (!Array.isArray(phase.tasks)) phase.tasks = [];
      pp.tasks.forEach(function (pt) {
        var found = null;
        for (var j = 0; j < phase.tasks.length; j++) {
          if (String(phase.tasks[j].text || "").trim().toLowerCase() === String(pt.text || "").trim().toLowerCase()) {
            found = phase.tasks[j]; break;
          }
        }
        if (!found) {
          phase.tasks.push({
            text: pt.text, done: !!pt.done,
            createdBy: "Sylvenson Richard",
            scope: pp.name,
            status: pt.done ? "done" : "open",
            createdAt: now, updatedAt: now,
            desc: pt.desc || ""
          });
          added++;
        } else {
          if (pt.done && !found.done) {
            found.done = true;
            found.status = "done";
            found.updatedAt = now;
            marked++;
          }
          /* Ranpli meta ki manke (task vye ki deja egziste) */
          if (!found.createdAt) found.createdAt = now;
          if (!found.createdBy) found.createdBy = "Sylvenson Richard";
          if (!found.scope) found.scope = pp.name;
          if (!found.status) found.status = found.done ? "done" : "open";
        }
      });
    });
    return { added: added, marked: marked };
  }

  /* ── Registry & current project ─────────────────────────────────────── */
  var registry = loadRegistry();
  var current = null; /* { key, name } */

  /* ── DOM refs ───────────────────────────────────────────────────────── */
  var $phases = document.getElementById("phases");
  var $pct = document.getElementById("globalPct");
  var $track = document.getElementById("globalTrack");
  var $counts = document.getElementById("globalCounts");
  var $overlay = document.getElementById("overlay");
  var $modal = document.getElementById("modalBox");
  var $toast = document.getElementById("toast");
  var $fileInput = document.getElementById("fileInput");
  var $folderInput = document.getElementById("folderInput");

  var toastTimer = null;

  /* ── Helpers ────────────────────────────────────────────────────────── */
  function loadRegistry() {
    try {
      var raw = localStorage.getItem(STORAGE_REGISTRY);
      if (raw) {
        var r = JSON.parse(raw);
        if (r && Array.isArray(r.projects)) return r;
      }
    } catch (e) {}
    return { folder: "~/Projects", projects: [] };
  }
  function saveRegistry() {
    try { localStorage.setItem(STORAGE_REGISTRY, JSON.stringify(registry)); }
    catch (e) { showToast("Save failed: " + (e && e.message ? e.message : e)); }
    dbScheduleSave(); /* miroir sou disk */
  }
  function dataKey(key) { return STORAGE_CHECK + key; }
  function slug(s) {
    return String(s || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "project";
  }
  function scaffold(name) {
    var data = deepClone(DEFAULT_DATA);
    data.project = name;
    data.updatedAt = new Date().toISOString();
    return data;
  }
  function loadProjectData(key, name) {
    try {
      var raw = localStorage.getItem(dataKey(key));
      if (raw) {
        var d = JSON.parse(raw);
        if (d && Array.isArray(d.phases)) { d.project = d.project || name; return d; }
      }
    } catch (e) {}
    return scaffold(name);
  }
  function saveCurrent() {
    if (!current) return;
    current.data.updatedAt = new Date().toISOString();
    current.data.project = current.name;
    try { localStorage.setItem(dataKey(current.key), JSON.stringify(current.data)); }
    catch (e) { showToast("Save failed: " + (e && e.message ? e.message : e)); }
    dbScheduleSave(); /* miroir sou disk */
  }
  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function findProject(key) {
    for (var i = 0; i < registry.projects.length; i++) {
      if (registry.projects[i].key === key) return registry.projects[i];
    }
    return null;
  }

  /* ── Local Disk Database (File System Access API) ─────────────────────
     Done yo pa nan browser ankò: yo nan yon fichye jrispace-pm.db sou
     disk la (folder user chwazi a). Lè user efface cache a, done yo rete
     sou disk la. localStorage sèvi sèlman kòm cache vitès.
     API a mande Chrome/Edge (desktop + Android). Fallback: localStorage. */
  var DB_FILE = "jrispace-pm.db";
  var db = {
    rootHandle: null, folderName: "", ready: false, saveTimer: null,
    idbName: "jrispace-pm-db", idbStore: "handles"
  };

  function dbSupported() {
    return typeof window.showDirectoryPicker === "function";
  }

  /* IndexedDB: kenbe root handle a pou re-konekte otomatikman apre reload
     (se yon pèmizyon, PA done — done yo nan fichye a sou disk) */
  function idbOpen() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(db.idbName, 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(db.idbStore)) req.result.createObjectStore(db.idbStore);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function idbPut(key, val) {
    return idbOpen().then(function (idb) {
      return new Promise(function (resolve, reject) {
        var tx = idb.transaction(db.idbStore, "readwrite");
        tx.objectStore(db.idbStore).put(val, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    }).catch(function () {});
  }
  function idbGet(key) {
    return idbOpen().then(function (idb) {
      return new Promise(function (resolve, reject) {
        var tx = idb.transaction(db.idbStore, "readonly");
        var rq = tx.objectStore(db.idbStore).get(key);
        rq.onsuccess = function () { resolve(rq.result); };
        rq.onerror = function () { reject(rq.error); };
      });
    }).catch(function () { return null; });
  }

  /* Chaje done yo depi fichye DB a sou disk → localStorage (cache) */
  async function dbLoadFromDisk() {
    if (!db.rootHandle) return false;
    try {
      var fh = await db.rootHandle.getFileHandle(DB_FILE, { create: false });
      var f = await fh.getFile();
      var text = await f.text();
      if (!text) return false;
      var data = JSON.parse(text);
      if (!data || !data.projects) return false;
      /* Merge (pa ranplase): DB file a se ground truth, men pwojè ki
         nan cache a men ki pa nan file a pa dwe pèdi (eg. file a pi ansyen) */
      var diskKeys = {};
      data.projects.forEach(function (p) { diskKeys[p.key] = true; });
      var cacheOnly = registry.projects.filter(function (p) { return !diskKeys[p.key]; });
      registry.projects = data.projects.concat(cacheOnly);
      registry.folder = data.folder || registry.folder;
      if (data.config) config = Object.assign({}, config, data.config);
      Object.keys(data.data || {}).forEach(function (key) {
        try { localStorage.setItem(dataKey(key), JSON.stringify(data.data[key])); } catch (e) {}
      });
      return true;
    } catch (e) { return false; }
  }

  /* Ekri tout eta a nan fichye DB a sou disk (JSON pretty) */
  async function dbWrite() {
    if (!db.rootHandle) return false;
    try {
      var payload = {
        format: "jrispace-pm", version: 1,
        savedAt: new Date().toISOString(),
        folder: registry.folder || "",
        projects: registry.projects,
        config: config,
        data: {}
      };
      registry.projects.forEach(function (p) {
        try {
          var raw = localStorage.getItem(dataKey(p.key));
          if (raw) payload.data[p.key] = JSON.parse(raw);
        } catch (e) {}
      });
      var fh = await db.rootHandle.getFileHandle(DB_FILE, { create: true });
      var w = await fh.createWritable();
      await w.write(JSON.stringify(payload, null, 2));
      await w.close();
      return true;
    } catch (e) { console.warn("DB write failed:", e); return false; }
  }

  function dbScheduleSave() {
    if (!db.ready || !db.rootHandle) return;
    clearTimeout(db.saveTimer);
    db.saveTimer = setTimeout(function () { dbWrite(); }, 600);
  }

  /* Kreye yon folder fizik pou yon pwojè + ekri checklist.json andedan */
  async function dbCreateProjectFolder(key, name) {
    if (!db.rootHandle) return false;
    try {
      var dir = await db.rootHandle.getDirectoryHandle(key, { create: true });
      var raw = localStorage.getItem(dataKey(key));
      if (raw) {
        try {
          var fh = await dir.getFileHandle("checklist.json", { create: true });
          var w = await fh.createWritable();
          await w.write(raw);
          await w.close();
        } catch (e) {}
      }
      return true;
    } catch (e) { console.warn("mkdir failed:", e); return false; }
  }

  /* Konekte DB a: user chwazi folder root la (user gesture obligatwa) */
  async function dbConnect() {
    if (!dbSupported()) {
      showToast("Disk database needs Chrome/Edge (File System Access API)");
      return false;
    }
    try {
      var dir = await window.showDirectoryPicker({ mode: "readwrite" });
      db.rootHandle = dir;
      db.folderName = dir.name;
      db.ready = true;
      idbPut("root", dir);
      var loaded = await dbLoadFromDisk();
      if (!loaded) await dbWrite(); /* premye fwa: kreye DB file la */
      saveRegistry();
      renderDbBadge();
      renderSidebar();
      /* Si done yo chaje depi disk epi pa gen pwojè chwazi → al pi premye a */
      if (loaded && registry.projects.length && !current) showProjects();
      else if (loaded && current) { current.data = loadProjectData(current.key, current.name); renderAll(); }
      else showProjects();
      showToast(loaded ? "💾 DB loaded: " + dir.name + "/" + DB_FILE
                       : "💾 DB created: " + dir.name + "/" + DB_FILE);
      return true;
    } catch (e) {
      if (e && e.name === "AbortError") return false; /* user cancel */
      console.warn("dbConnect failed:", e);
      return false;
    }
  }

  /* Re-konekte otomatikman depi IndexedDB (pèmizyon deja bay) */
  async function dbAutoReconnect() {
    if (!dbSupported() || !indexedDB) return false;
    try {
      var handle = await idbGet("root");
      if (!handle) return false;
      var perm = await handle.queryPermission({ mode: "readwrite" });
      if (perm !== "granted") return false; /* san gesture pa ka mande */
      db.rootHandle = handle;
      db.folderName = handle.name;
      db.ready = true;
      var loaded = await dbLoadFromDisk();
      renderDbBadge();
      renderSidebar();
      if (loaded) {
        if (registry.projects.length) showProjects();
        else { current = null; renderAll(); }
      }
      return loaded;
    } catch (e) { return false; }
  }

  /* Backup: kopye DB file la ak yon timestamp (rete nan menm folder a) */
  async function dbBackup() {
    if (!db.ready || !db.rootHandle) {
      showToast("Connect the database first (💾 Connect DB)");
      return false;
    }
    try {
      var fh = await db.rootHandle.getFileHandle(DB_FILE, { create: false });
      var f = await fh.getFile();
      var content = await f.text();
      var stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      var backupName = DB_FILE.replace(/\.db$/, "") + "-backup-" + stamp + ".db";
      var bfh = await db.rootHandle.getFileHandle(backupName, { create: true });
      var w = await bfh.createWritable();
      await w.write(content);
      await w.close();
      showToast("🗄 Backup created: " + backupName);
      return true;
    } catch (e) {
      showToast("Backup failed: " + (e && e.message ? e.message : e));
      return false;
    }
  }

  /* Restore: user chwazi yon fichye .db → ranplase DB file la epi re-chaje tout */
  async function dbRestoreFromFile(file) {
    if (!file) return false;
    try {
      var text = await file.text();
      var data = JSON.parse(text);
      if (!data || data.format !== "jrispace-pm") throw new Error("Not a jrispace-pm database file");
      /* Ekri nan disk (si DB konekte) */
      if (db.ready && db.rootHandle) {
        var fh = await db.rootHandle.getFileHandle(DB_FILE, { create: true });
        var w = await fh.createWritable();
        await w.write(text);
        await w.close();
      }
      /* Aplike nan memwa + cache */
      registry.projects = data.projects || [];
      if (data.config) config = Object.assign({}, config, data.config);
      saveConfig();
      Object.keys(data.data || {}).forEach(function (key) {
        try { localStorage.setItem(dataKey(key), JSON.stringify(data.data[key])); } catch (e) {}
      });
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf("jrispace.checklist.v2.") === 0) {
          var key = k.slice("jrispace.checklist.v2.".length);
          if (!data.data || !data.data[key]) { try { localStorage.removeItem(k); } catch (e) {} }
        }
      });
      if (registry.projects.length) showProjects();
      else { current = null; renderAll(); }
      saveRegistry();
      renderSidebar();
      renderDbBadge();
      showToast("♻ Database restored: " + (file.name || "backup") + " (" + registry.projects.length + " projects)");
      return true;
    } catch (e) {
      showToast("Restore failed: " + (e && e.message ? e.message : e));
      return false;
    }
  }

  /* Endikatè UI: kote done yo ye */
  function renderDbBadge() {
    var el = document.getElementById("dbBadge");
    if (!el) return;
    if (db.ready && db.rootHandle) {
      el.textContent = "💾 " + db.folderName + "/" + DB_FILE;
      el.className = "badge db-on";
    } else if (dbSupported()) {
      el.textContent = "💾 Browser only — connect a folder";
      el.className = "badge db-off";
    } else {
      el.textContent = "💾 Browser only (needs Chrome/Edge)";
      el.className = "badge db-off";
    }
  }

  /* ── Non default pwojè a — DINAMIK: si wizard la rename konpayi an, tout
     nouvo pwojè yo pran non sa a. Otreman jenerik: "My Project". ─────── */
  function defaultProjectName() {
    var c = config && config.company;
    return (c && c !== "Local Projects Manager") ? c : "My Project";
  }
  function defaultProjectKey() { return slug(defaultProjectName()); }

  /* ── Migration: legacy single-project data → project ─────────────────
     IMPORTANT: pa janm kreye yon pwojè default. Fresh install = registry
     vid = totally clean. Sèlman imigre si gen done legacy (v1). ─────── */
  function migrateLegacyIfNeeded() {
    if (registry.projects.length > 0) return;
    try {
      var raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && Array.isArray(d.phases)) {
          d.project = d.project || defaultProjectName();
          var key = slug(d.project);
          var p = { key: key, name: d.project };
          if (!findProject(key)) registry.projects.push(p);
          localStorage.setItem(dataKey(key), JSON.stringify(d));
          localStorage.removeItem(LEGACY_KEY);
          saveRegistry();
          return;
        }
      }
    } catch (e) {}
    /* pa gen done → pa kreye anyen (app la rete pwòp) */
  }

  /* ── Progress ───────────────────────────────────────────────────────── */
  function phaseProgress(phase) {
    var t = phase.tasks.length;
    var d = phase.tasks.filter(function (x) { return x.done; }).length;
    return { total: t, done: d, pct: t ? Math.round(d / t * 100) : 0 };
  }
  function globalProgress() {
    var t = 0, d = 0;
    if (!current) return { total: 0, done: 0, pct: 0 };
    current.data.phases.forEach(function (p) { t += p.tasks.length; d += p.tasks.filter(function (x) { return x.done; }).length; });
    return { total: t, done: d, pct: t ? Math.round(d / t * 100) : 0 };
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  function renderSidebar() {
    /* Projects list moved to dedicated Projects page — just update folder input */
    var sideProjectsEl = document.getElementById("sideProjects");
    if (sideProjectsEl) sideProjectsEl.innerHTML = "";
    $folderInput.value = registry.folder || "~/Projects";
  }

  /* ── Projects nav button ────────────────────────────────────── */
  var $btnViewProjects = document.getElementById("btnViewProjects");
  if ($btnViewProjects) {
    $btnViewProjects.addEventListener("click", function () { showProjects(); });
  }

  /* ── New project button (sidebar) ──────────────────────────── */
  var $btnNewProjectSidebar = document.getElementById("btnNewProject");
  if ($btnNewProjectSidebar) {
    $btnNewProjectSidebar.addEventListener("click", function () { openNameModal("new"); });
  }

  var searchQuery = "";

  /* ── Render Tasks Page (all tasks across all projects) ──────────── */
  function renderTasksPage() {
    var $list = document.getElementById("taskGlobalList");
    var $counts = document.getElementById("taskGlobalCounts");
    var $pct = document.getElementById("taskGlobalPct");
    var $track = document.getElementById("taskGlobalTrack");
    var $filterProj = document.getElementById("taskFilterProject");
    var $filterStatus = document.getElementById("taskFilterStatus");
    var $search = document.getElementById("taskSearchGlobal");
    if (!$list) return;

    /* Populate project filter dropdown */
    if ($filterProj && $filterProj.options.length <= 1) {
      registry.projects.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p.key;
        opt.textContent = p.name;
        $filterProj.appendChild(opt);
      });
    }

    var filterKey = $filterProj ? $filterProj.value : "";
    var filterStatus = $filterStatus ? $filterStatus.value : "";
    var query = $search ? $search.value.toLowerCase().trim() : "";

    var totalAll = 0, doneAll = 0;
    var html = "";

    registry.projects.forEach(function (p) {
      var data = loadProjectData(p.key, p.name);
      if (filterKey && p.key !== filterKey) return;

      var projectTasks = [];
      data.phases.forEach(function (phase) {
        phase.tasks.forEach(function (task) {
          if (filterStatus === "done" && !task.done) return;
          if (filterStatus === "pending" && task.done) return;
          if (query && task.text.toLowerCase().indexOf(query) === -1) return;
          totalAll++;
          if (task.done) doneAll++;
          projectTasks.push({ text: task.text, done: task.done, phase: phase.name, priority: task.priority || "", dueDate: task.dueDate || "", notes: task.notes || "", subtasks: task.subtasks || [] });
        });
      });

      if (projectTasks.length === 0) return;

      html += '<div class="card mb-4">';
      html += '<div class="card-header"><div class="card-title">' + esc(p.name) + '</div>';
      html += '<span style="font-size:12px;color:var(--text-muted);">' + projectTasks.filter(function (t) { return t.done; }).length + '/' + projectTasks.length + '</span></div>';
      html += '<div style="padding:0 20px 12px;">';
      projectTasks.forEach(function (task) {
        var overdue = task.dueDate && !task.done && task.dueDate < todayISO();
        html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-primary);">';
        html += '<span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;' + (task.done ? 'background:#10b981;' : overdue ? 'background:#f87171;' : 'background:var(--text-muted);') + '"></span>';
        html += '<div style="flex:1;min-width:0;">';
        html += '<div class="task-meta">';
        if (task.priority) {
          var prioLabels = { high: "🔴 High", med: "🟠 Medium", low: "🟢 Low" };
          html += '<span class="badge badge-priority-' + task.priority + '">' + (prioLabels[task.priority] || task.priority) + '</span>';
        }
        if (task.dueDate) {
          html += '<span class="badge badge-due' + (overdue ? ' overdue' : '') + '">' + task.dueDate + (overdue ? ' ⚠' : '') + '</span>';
        }
        if (task.subtasks.length > 0) {
          var stDone = task.subtasks.filter(function (s) { return s.done; }).length;
          html += '<span class="badge badge-subtasks">' + stDone + '/' + task.subtasks.length + ' sub</span>';
        }
        html += '</div>';
        html += '<span style="font-size:13px;color:var(--text-secondary);' + (task.done ? 'text-decoration:line-through;opacity:.6;' : '') + '">' + esc(task.text) + '</span>';
        if (task.notes) {
          html += '<div class="task-notes-preview">' + esc(task.notes) + '</div>';
        }
        html += '<span style="font-size:11px;color:var(--text-muted);">' + esc(task.phase) + '</span>';
        html += '</div></div>';
      });
      html += '</div></div>';
    });

    $list.innerHTML = html || '<div style="text-align:center;padding:40px;color:var(--text-muted);">No tasks found</div>';
    if ($counts) $counts.textContent = doneAll + " / " + totalAll + " tasks";
    if ($pct) $pct.textContent = (totalAll ? Math.round(doneAll / totalAll * 100) : 0) + "%";
    if ($track) $track.style.width = (totalAll ? Math.round(doneAll / totalAll * 100) : 0) + "%";
  }

  function renderPhases() {
    $phases.innerHTML = "";
    if (!current || !current.data.phases.length) {
      $phases.innerHTML = '<div class="phase"><div class="phase-head"><div class="phase-info"><div class="phase-name">No phases yet</div><div class="phase-desc">Use “+ Phase” or “+ New project” to get started.</div></div></div></div>';
      return;
    }
    current.data.phases.forEach(function (phase, pi) {
      var prog = phaseProgress(phase);
      var open = phase._open !== false;
      var card = document.createElement("section");
      card.className = "phase" + (open ? " open" : "");

      var head = document.createElement("div");
      head.className = "phase-head";
      head.innerHTML =
        '<span class="chev">▶</span>' +
        '<div class="phase-info">' +
          '<div class="phase-name">' + esc(phase.name || "Phase " + (pi + 1)) + '</div>' +
          (phase.desc ? '<div class="phase-desc">' + esc(phase.desc) + '</div>' : "") +
        '</div>' +
        '<div class="phase-meta">' +
          '<div class="mini-track"><div style="width:' + prog.pct + '%"></div></div>' +
          '<span class="pchip' + (prog.done && prog.done === prog.total ? ' done' : '') + '">' + prog.done + '/' + prog.total + ' · ' + prog.pct + '%</span>' +
        '</div>';
      head.addEventListener("click", function () {
        phase._open = phase._open === false ? true : false;
        saveCurrent(); renderPhases();
      });
      card.appendChild(head);

      var body = document.createElement("div");
      body.className = "phase-body";

      var ul = document.createElement("ul");
      ul.className = "tasks";
      phase.tasks.forEach(function (task, ti) {
        if (searchQuery) {
          var hay = ((task.text || "") + " " + (task.notes || "") + " " + (phase.name || "")).toLowerCase();
          if (hay.indexOf(searchQuery) < 0) return;
        }
        var li = document.createElement("li");
        li.className = "task" + (task.done ? " done" : "") + (isOverdue(task) ? " overdue" : "");
        li.classList.add("task-row-click");
        li.setAttribute("role", "button");
        li.setAttribute("tabindex", "0");
        li.setAttribute("aria-label", (task.done ? "Done: " : "Open: ") + (task.text || ""));

        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!task.done;
        cb.setAttribute("aria-label", "Mark done: " + (task.text || ""));
        cb.addEventListener("click", function (e) { e.stopPropagation(); });
        cb.addEventListener("change", function () {
          task.done = cb.checked;
          if (task.done && navigator.vibrate) navigator.vibrate(10);
          logActivity(task.done ? "completed" : "edited", (task.done ? "Completed" : "Reopened") + " task <strong>" + esc(task.text) + "</strong>", current.name);
          saveCurrent(); renderPhases();
        });

        var label = document.createElement("div");
        label.className = "t-label";
        var prio = prioLabel(task.priority);
        if (prio || task.dueDate) {
          var meta = document.createElement("div");
          meta.className = "t-meta";
          if (prio) {
            var pb = document.createElement("span");
            pb.className = "prio p-" + task.priority;
            pb.textContent = prio;
            pb.title = "Priority: " + task.priority;
            meta.appendChild(pb);
          }
          if (task.dueDate) {
            var db = document.createElement("span");
            db.className = "due" + (isOverdue(task) ? " overdue" : "");
            db.textContent = "📅 " + task.dueDate + (isOverdue(task) ? " ⚠" : "");
            db.title = isOverdue(task) ? "Overdue" : "Due date";
            meta.appendChild(db);
          }
          label.appendChild(meta);
        }
        label.appendChild(document.createTextNode(task.text || ""));
        if (task.notes) {
          var n = document.createElement("div");
          n.className = "t-notes";
          n.textContent = task.notes;
          label.appendChild(n);
        }
        if (task.subtasks && task.subtasks.length) {
          var stDone = task.subtasks.filter(function (s) { return s.done; }).length;
          var st = document.createElement("div");
          st.className = "t-notes";
          st.style.color = "var(--brand)";
          st.textContent = "▸ " + stDone + "/" + task.subtasks.length + " sub-tasks";
          label.appendChild(st);
        }

        var btns = document.createElement("div");
        btns.className = "t-btns";
        var btnEdit = document.createElement("button");
        btnEdit.className = "edit"; btnEdit.textContent = "Edit";
        btnEdit.addEventListener("click", function (e) { e.stopPropagation(); openTaskModal(pi, ti); });
        var btnDel = document.createElement("button");
        btnDel.className = "del"; btnDel.textContent = "✕";
        btnDel.title = "Delete task";
        btnDel.setAttribute("aria-label", "Delete task: " + (task.text || ""));
        btnDel.addEventListener("click", function (e) {
          e.stopPropagation();
          var saved = { pi: pi, ti: ti, task: JSON.parse(JSON.stringify(task)) };
          logActivity("deleted", "Deleted task <strong>" + esc(task.text) + "</strong>", current.name);
          phase.tasks.splice(ti, 1); saveCurrent(); renderPhases();
          pushUndo("Task deleted", function () {
            current.data.phases[saved.pi].tasks.splice(Math.min(saved.ti, current.data.phases[saved.pi].tasks.length), 0, saved.task);
            saveCurrent(); renderPhases();
          });
        });
        btns.appendChild(btnEdit);
        btns.appendChild(btnDel);

        /* Klike sou row → side sheet (details + sub-tasks) */
        li.addEventListener("click", function () {
          openTaskSheet(pi, ti);
        });

        /* Swipe left (mobil) → delete task ak undo */
        (function (li, pi, ti, task) {
          var x0 = null, y0 = null;
          li.addEventListener("touchstart", function (e) {
            x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
          }, { passive: true });
          li.addEventListener("touchend", function (e) {
            if (x0 === null) return;
            var dx = e.changedTouches[0].clientX - x0;
            var dy = e.changedTouches[0].clientY - y0;
            if (dx < -70 && Math.abs(dy) < 40) {
              e.preventDefault();
              var saved = { pi: pi, ti: ti, task: JSON.parse(JSON.stringify(task)) };
              current.data.phases[pi].tasks.splice(ti, 1);
              saveCurrent(); renderPhases();
              if (navigator.vibrate) navigator.vibrate([12, 40, 12]);
              pushUndo("Task deleted", function () {
                current.data.phases[saved.pi].tasks.splice(Math.min(saved.ti, current.data.phases[saved.pi].tasks.length), 0, saved.task);
                saveCurrent(); renderPhases();
              });
            }
            x0 = null; y0 = null;
          }, { passive: false });
        })(li, pi, ti, task);

        li.appendChild(cb);
        li.appendChild(label);
        li.appendChild(btns);
        ul.appendChild(li);
      });
      body.appendChild(ul);

      var row = document.createElement("div");
      row.className = "add-row";
      var input = document.createElement("input");
      input.placeholder = "Add a task to \"" + esc(phase.name) + "\"…";
      var addBtn = document.createElement("button");
      addBtn.textContent = "Add";
      addBtn.className = "primary";
      function doAdd() {
        var v = input.value.trim();
        if (!v) return;
        phase.tasks.push({
          text: v, done: false,
          createdAt: new Date().toISOString(),
          createdBy: config.company || "Me",
          scope: phase.name,
          status: "open"
        });
        input.value = ""; saveCurrent(); renderPhases();
      }
      addBtn.addEventListener("click", doAdd);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); doAdd(); }
      });
      row.appendChild(input);
      row.appendChild(addBtn);
      body.appendChild(row);

      var delPhase = document.createElement("div");
      delPhase.style.cssText = "text-align:right;margin-top:8px;";
      var delBtn = document.createElement("button");
      delBtn.className = "ghost-danger"; delBtn.textContent = "Delete phase";
      delBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (confirm('Delete phase "' + phase.name + '" and all its tasks?')) {
          var saved = { pi: pi, phase: JSON.parse(JSON.stringify(phase)) };
          current.data.phases.splice(pi, 1); saveCurrent(); renderPhases();
          pushUndo('Phase "' + saved.phase.name + '" deleted', function () {
            current.data.phases.splice(Math.min(saved.pi, current.data.phases.length), 0, saved.phase);
            saveCurrent(); renderPhases();
          });
        }
      });
      delPhase.appendChild(delBtn);
      body.appendChild(delPhase);

      card.appendChild(body);
      $phases.appendChild(card);
    });

    var g = globalProgress();
    $pct.textContent = g.pct + "%";
    $track.style.width = g.pct + "%";
    $counts.textContent = g.done + " / " + g.total + " tasks";
  }

  function renderAll() {
    var $head = document.getElementById("headProjectDetail");
    if ($head) $head.textContent = current ? current.name : "—";
    renderSidebar();
    if (currentView === "project") {
      renderPhasesDetail();
      updateProjectSummary();
    } else {
      renderPhases();
    }
  }

  /* ── Project switching ──────────────────────────────────────────────── */
  function switchTo(key) {
    var p = findProject(key);
    if (!p) {
      if (registry.projects.length) p = registry.projects[0];
      else { current = null; renderAll(); return; } /* pa gen pwojè → clean state */
    }
    p.data = loadProjectData(p.key, p.name);
    /* Sync profile: yon fwa pou chak pwojè (si li matche yon profile) */
    if (p.data && !p.data._profileSynced) {
      var r = syncProjectProfile(p);
      if (r && (r.added || r.marked)) {
        p.data._profileSynced = true;
        p.data.updatedAt = new Date().toISOString();
        try { localStorage.setItem(dataKey(p.key), JSON.stringify(p.data)); } catch (e) {}
        showToast("Profile sync: +" + r.added + " tasks, " + r.marked + " marked done");
      } else if (r) {
        p.data._profileSynced = true;
        try { localStorage.setItem(dataKey(p.key), JSON.stringify(p.data)); } catch (e) {}
      }
    }
    current = p;
    currentView = "project";
    switchToProject(key);
  }

  var sideProjectsEl = document.getElementById("sideProjects");
  if (sideProjectsEl) {
    sideProjectsEl.addEventListener("click", function (e) {
      /* Projects list moved to Projects page — no sidebar click needed */
    });
  }

/* ── Modal (add/edit task) ──────────────────────────────────────────── */
  function openTaskModal(pi, ti) {
    var task = ti == null ? null : current.data.phases[pi].tasks[ti];
    var phaseNames = current.data.phases.map(function (p) { return p.name; });
    $modal.innerHTML =
      '<h3>' + (task ? "Edit task" : "Add task") + '</h3>' +
      '<label style="font-size:12.5px;color:var(--muted);display:block;margin-bottom:4px;">Phase</label>' +
      '<select id="mPhase" style="width:100%;font:inherit;padding:9px 12px;border:1px solid var(--border);border-radius:9px;outline:none;margin-bottom:12px;background:#fff;">' +
        phaseNames.map(function (n, i) { return '<option value="' + i + '"' + (i === pi ? " selected" : "") + '>' + esc(n) + '</option>'; }).join("") +
      '</select>' +
      '<label style="font-size:12.5px;color:var(--muted);display:block;margin-bottom:4px;">Task</label>' +
      '<input id="mText" type="text" value="' + (task ? esc(task.text) : "") + '" placeholder="Task description" />' +
      '<label style="font-size:12.5px;color:var(--muted);display:block;margin-bottom:4px;">Notes (optional)</label>' +
      '<textarea id="mNotes" placeholder="Optional notes…">' + (task && task.notes ? esc(task.notes) : "") + '</textarea>' +
      '<div style="display:flex;gap:10px;margin-bottom:12px;">' +
        '<div style="flex:1;">' +
          '<label style="font-size:12.5px;color:var(--muted);display:block;margin-bottom:4px;">Due date (optional)</label>' +
          '<input id="mDue" type="date" value="' + (task && task.dueDate ? esc(task.dueDate) : "") + '" style="width:100%;font:inherit;padding:9px 12px;border:1px solid var(--border);border-radius:9px;outline:none;background:#fff;color:var(--ink);" />' +
        '</div>' +
        '<div style="flex:1;">' +
          '<label style="font-size:12.5px;color:var(--muted);display:block;margin-bottom:4px;">Priority</label>' +
          '<select id="mPriority" style="width:100%;font:inherit;padding:9px 12px;border:1px solid var(--border);border-radius:9px;outline:none;background:#fff;color:var(--ink);">' +
            '<option value="">None</option>' +
            '<option value="high"' + (task && task.priority === "high" ? " selected" : "") + '>🔴 High</option>' +
            '<option value="med"' + (task && task.priority === "med" ? " selected" : "") + '>🟠 Medium</option>' +
            '<option value="low"' + (task && task.priority === "low" ? " selected" : "") + '>🟢 Low</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div id="modalSubSection"></div>' +
      '<div class="m-actions">' +
        '<button id="mCancel">Cancel</button>' +
        '<button id="mSave" class="primary">Save</button>' +
      '</div>';
    $overlay.classList.add("show");
    var $text = document.getElementById("mText");
    var mPhase = document.getElementById("mPhase");
    var mPhaseIdx = pi;

    function getTargetTask() {
      var pi2 = parseInt(mPhase.value, 10);
      var phase = current.data.phases[pi2];
      if (ti != null && phase.tasks[ti]) return phase.tasks[ti];
      return null;
    }

    function renderModalSubs() {
      var targetTask = getTargetTask();
      var section = document.getElementById("modalSubSection");
      if (!targetTask || !targetTask.subtasks || !targetTask.subtasks.length) {
        var count = targetTask ? targetTask.subtasks.length : 0;
        section.innerHTML =
          '<div class="modal-subtitle">Sub-tasks <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0;">(' + count + ')</span></div>' +
          '<p style="color:var(--muted);font-size:12.5px;margin:0 0 8px;">No sub-tasks yet — add one below.</p>' +
          '<div class="modal-add-sub">' +
            '<input id="modalNewSub" placeholder="Add a sub-task…" maxlength="200" />' +
            '<button class="primary" id="modalAddSubBtn">Add</button>' +
          '</div>';
        var $inp = document.getElementById("modalNewSub");
        if ($inp) {
          $inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doAddModalSub(); } });
        }
        if (document.getElementById("modalAddSubBtn")) {
          var _el_modalAddSubBtn = document.getElementById("modalAddSubBtn");

          if (_el_modalAddSubBtn) _el_modalAddSubBtn.addEventListener("click", doAddModalSub);
        }
        if ($inp) setTimeout(function () { $inp.focus(); }, 60);
        return;
      }
      var st = targetTask.subtasks;
      var stDone = st.filter(function (s) { return s.done; }).length;
      section.innerHTML =
        '<div class="modal-subtitle">Sub-tasks <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0;">(' + stDone + '/' + st.length + ')</span></div>' +
        st.map(function (s, si) {
          return '<div class="modal-subtask' + (s.done ? ' done' : '') + '">' +
            '<input type="checkbox" data-msi="' + si + '" class="modal-st-cb"' + (s.done ? " checked" : "") + ' />' +
            '<span class="modal-st-label">' + esc(s.text || "") + '</span>' +
            '<button class="modal-st-del" data-msi="' + si + '" title="Delete sub-task">✕</button>' +
          '</div>';
        }).join('') +
        '<div class="modal-add-sub">' +
          '<input id="modalNewSub" placeholder="Add a sub-task…" maxlength="200" />' +
          '<button class="primary" id="modalAddSubBtn">Add</button>' +
        '</div>';
      /* Wire sub-task event handlers */
      section.querySelectorAll(".modal-st-cb").forEach(function (cb) {
        cb.addEventListener("change", function () {
          targetTask.subtasks[+cb.dataset.msi].done = cb.checked;
          targetTask.updatedAt = new Date().toISOString();
          saveCurrent(); renderPhases(); renderModalSubs();
        });
      });
      section.querySelectorAll(".modal-st-del").forEach(function (b) {
        b.addEventListener("click", function () {
          targetTask.subtasks.splice(+b.dataset.msi, 1);
          targetTask.updatedAt = new Date().toISOString();
          saveCurrent(); renderPhases(); renderModalSubs();
        });
      });
      var $inp = document.getElementById("modalNewSub");
      if ($inp) {
        $inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doAddModalSub(); } });
      }
      if (document.getElementById("modalAddSubBtn")) {
        var _el_modalAddSubBtn = document.getElementById("modalAddSubBtn");

        if (_el_modalAddSubBtn) _el_modalAddSubBtn.addEventListener("click", doAddModalSub);
      }
      setTimeout(function () { var f = document.getElementById("modalNewSub"); if (f) f.focus(); }, 60);
    }

    function doAddModalSub() {
      var $inp = document.getElementById("modalNewSub");
      var v = $inp ? $inp.value.trim() : "";
      if (!v) return;
      var targetTask = getTargetTask();
      if (!targetTask) return;
      if (!targetTask.subtasks) targetTask.subtasks = [];
      targetTask.subtasks.push({ text: v, done: false, createdBy: config.company || "Me", createdAt: new Date().toISOString() });
      targetTask.updatedAt = new Date().toISOString();
      if ($inp) $inp.value = "";
      saveCurrent(); renderPhases(); renderModalSubs();
    }

    function closeModal() { $overlay.classList.remove("show"); }
    var _el_mCancel = document.getElementById("mCancel");

    if (_el_mCancel) _el_mCancel.addEventListener("click", closeModal);
    $overlay.addEventListener("click", function (e) { if (e.target === $overlay) closeModal(); });
    mPhase.addEventListener("change", function () {
      mPhaseIdx = parseInt(mPhase.value, 10);
      renderModalSubs();
    });
    var _el_mSave = document.getElementById("mSave");

    if (_el_mSave) _el_mSave.addEventListener("click", function () {
      var v = $text.value.trim();
      if (!v) { $text.focus(); return; }
      var pIdx = parseInt(mPhase.value, 10);
      var notes = document.getElementById("mNotes").value.trim() || undefined;
      var due = document.getElementById("mDue").value || undefined;
      var prio = document.getElementById("mPriority").value || undefined;
      if (task) {
        task.text = v; task.notes = notes; task.updatedAt = new Date().toISOString();
        task.dueDate = due; task.priority = prio;
        logActivity("edited", "Edited task <strong>" + esc(v) + "</strong>", current.name);
      }
      else {
        current.data.phases[pIdx].tasks.push({
          text: v, done: false, notes: notes,
          createdAt: new Date().toISOString(),
          createdBy: config.company || "Me",
          scope: current.data.phases[pIdx].name,
          status: "open",
          dueDate: due, priority: prio,
          subtasks: []
        });
        logActivity("created", "Created task <strong>" + esc(v) + "</strong> in " + esc(current.data.phases[pIdx].name), current.name);
      }
      saveCurrent(); closeModal(); renderPhases();
    });
    $text.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); document.getElementById("mSave").click(); } });
    setTimeout(function () { $text.focus(); $text.select(); }, 30);

    /* Render sub-tasks after modal is visible */
    setTimeout(function () { renderModalSubs(); }, 50);
  }

  /* ── Task side sheet: details + sub-tasks ───────────────────────────── */
  var $sheetOverlay = document.getElementById("sheetOverlay");
  var $sideSheet = document.getElementById("sideSheet");
  var sheetCtx = { pi: -1, ti: -1 };

  function fmtDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function prioLabel(p) { return { high: "🔴", med: "🟠", low: "🟢" }[p] || ""; }
  function isOverdue(t) { return t.dueDate && !t.done && t.dueDate < todayISO(); }
  function statusBadgeClass(status) {
    if (status === "done") return "done";
    if (status === "blocked") return "blocked";
    if (status === "progress") return "progress";
    return "open";
  }
  function statusLabel(status) {
    var map = { open: t("stOpen"), progress: t("stProgress"), done: t("stDone"), blocked: t("stBlocked") };
    return map[status] || t("stOpen");
  }
  function taskStatus(task) {
    if (task.status) return task.status;
    if (task.done) return "done";
    return "open";
  }

  function renderSheet() {
    var phase = current.data.phases[sheetCtx.pi];
    var task = phase && phase.tasks[sheetCtx.ti];
    if (!phase || !task) { closeSheet(); return; }

    var st = task.subtasks || [];
    var stDone = st.filter(function (s) { return s.done; }).length;
    var createdBy = task.createdBy || config.company || "—";
    var scope = task.scope || phase.name || "—";
    var status = taskStatus(task);
    var prioLabel = task.priority ? t("pr" + { high: "High", med: "Med", low: "Low" }[task.priority]) : null;
    var isOverdue = task.dueDate && !task.done && task.dueDate < todayISO();
    var dueCell = task.dueDate
      ? (isOverdue
          ? '<span class="due overdue">⚠ ' + task.dueDate + '</span>'
          : '<span class="due">📅 ' + task.dueDate + '</span>')
      : "—";

    var head =
      '<div class="ss-head">' +
        '<div class="ss-title">' +
          '<span class="ss-badge ' + statusBadgeClass(status) + '">' + statusLabel(status) + '</span>' +
          '<h3>' + esc(task.text || "") + '</h3>' +
        '</div>' +
        '<button class="ss-close" id="ssClose" title="Close (Esc)">✕</button>' +
      '</div>';

    var meta =
      '<div class="ss-meta">' +
        '<div class="kv"><b>Project</b><span>' + esc(current ? current.name : "—") + '</span></div>' +
        '<div class="kv"><b>Scope / Phase</b><span>' + esc(scope) + '</span></div>' +
        '<div class="kv"><b>Created by</b><span>' + esc(createdBy) + '</span></div>' +
        '<div class="kv"><b>Created at</b><span>' + fmtDate(task.createdAt) + '</span></div>' +
        '<div class="kv"><b>Status</b><span>' + statusLabel(status) + '</span></div>' +
        (prioLabel ? '<div class="kv"><b>Priority</b><span>' + prioLabel + '</span></div>' : "") +
        '<div class="kv"><b>Due date</b><span>' + dueCell + '</span></div>' +
        '<div class="kv"><b>Updated at</b><span>' + fmtDate(task.updatedAt) + '</span></div>' +
      '</div>' +
      (task.desc ? '<div class="ss-desc">' + esc(task.desc) + '</div>' : "");

    var statusSel =
      '<div class="ss-status">' +
        '<label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);display:block;margin-bottom:5px;">Set status</label>' +
        '<select id="ssStatus">' +
          '<option value="open"' + (status === "open" ? " selected" : "") + '>Open</option>' +
          '<option value="progress"' + (status === "progress" ? " selected" : "") + '>In progress</option>' +
          '<option value="done"' + (status === "done" ? " selected" : "") + '>Done</option>' +
          '<option value="blocked"' + (status === "blocked" ? " selected" : "") + '>Blocked</option>' +
        '</select>' +
      '</div>';

    var subs =
      '<div class="ss-sub-title">Sub-tasks <span class="cnt">' + stDone + '/' + st.length + '</span></div>' +
      (st.length
        ? '<ul class="subtasks">' + st.map(function (s, si) {
            return '<li class="' + (s.done ? "done" : "") + '">' +
              '<input type="checkbox" data-si="' + si + '" class="st-cb"' + (s.done ? " checked" : "") + ' />' +
              '<span class="st-label">' + esc(s.text || "") + '</span>' +
              '<span style="font-size:10.5px;color:var(--muted);flex-shrink:0;">' + (s.createdBy ? esc(s.createdBy) : "") + '</span>' +
              '<button class="st-del" data-si="' + si + '" title="Delete sub-task">✕</button>' +
            '</li>';
          }).join("") + '</ul>'
        : '<p style="color:var(--muted);font-size:13px;margin:0;">No sub-tasks yet — add one below.</p>') +
      '<div class="ss-add-sub">' +
        '<input id="ssNewSub" placeholder="Add a sub-task…" maxlength="200" />' +
        '<button class="primary" id="ssAddSub">Add</button>' +
      '</div>';

    var notes = task.notes
      ? '<div class="ss-notes-label">Notes</div><div class="ss-notes">' + esc(task.notes) + '</div>'
      : "";

    var foot =
      '<div class="ss-foot">' +
        '<button id="ssEdit" class="edit">✏️ Edit task</button>' +
        '<button id="ssDel" class="ghost-danger">Delete</button>' +
      '</div>';

    $sideSheet.innerHTML = head + '<div class="ss-body">' + meta + statusSel + subs + notes + '</div>' + foot;

    var _el_ssClose = document.getElementById("ssClose");


    if (_el_ssClose) _el_ssClose.addEventListener("click", closeSheet);
    $sheetOverlay.addEventListener("click", function (e) { if (e.target === $sheetOverlay) closeSheet(); });

    /* status */
    var _el_ssStatus = document.getElementById("ssStatus");

    if (_el_ssStatus) _el_ssStatus.addEventListener("change", function (e) {
      var v = e.target.value;
      task.status = v;
      task.done = v === "done";
      task.updatedAt = new Date().toISOString();
      saveCurrent(); renderPhases(); renderSheet();
    });

    /* sub-tasks */
    var $inp = document.getElementById("ssNewSub");
    function doAddSub() {
      var v = $inp.value.trim();
      if (!v) return;
      if (!task.subtasks) task.subtasks = [];
      task.subtasks.push({ text: v, done: false, createdBy: config.company || "Me", createdAt: new Date().toISOString() });
      task.updatedAt = new Date().toISOString();
      $inp.value = "";
      saveCurrent(); renderPhases(); renderSheet();
    }
    var _el_ssAddSub = document.getElementById("ssAddSub");

    if (_el_ssAddSub) _el_ssAddSub.addEventListener("click", doAddSub);
    $inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doAddSub(); } });
    setTimeout(function () { var f = document.getElementById("ssNewSub"); if (f) f.focus(); }, 40);

    $sideSheet.querySelectorAll(".st-cb").forEach(function (cb) {
      cb.addEventListener("change", function () {
        task.subtasks[+cb.dataset.si].done = cb.checked;
        task.updatedAt = new Date().toISOString();
        saveCurrent(); renderPhases(); renderSheet();
      });
    });
    $sideSheet.querySelectorAll(".st-del").forEach(function (b) {
      b.addEventListener("click", function () {
        task.subtasks.splice(+b.dataset.si, 1);
        task.updatedAt = new Date().toISOString();
        saveCurrent(); renderPhases(); renderSheet();
      });
    });

    /* edit / delete from sheet */
    var _el_ssEdit = document.getElementById("ssEdit");

    if (_el_ssEdit) _el_ssEdit.addEventListener("click", function () { closeSheet(); openTaskModal(sheetCtx.pi, sheetCtx.ti); });
    var _el_ssDel = document.getElementById("ssDel");

    if (_el_ssDel) _el_ssDel.addEventListener("click", function () {
      if (!confirm("Delete this task?")) return;
      var saved = { pi: sheetCtx.pi, ti: sheetCtx.ti, task: JSON.parse(JSON.stringify(task)) };
      current.data.phases[sheetCtx.pi].tasks.splice(sheetCtx.ti, 1);
      saveCurrent(); closeSheet(); renderPhases();
      pushUndo("Task deleted", function () {
        current.data.phases[saved.pi].tasks.splice(Math.min(saved.ti, current.data.phases[saved.pi].tasks.length), 0, saved.task);
        saveCurrent(); renderPhases();
      });
    });
  }

  function openTaskSheet(pi, ti) {
    sheetCtx.pi = pi; sheetCtx.ti = ti;
    renderSheet();
    $sheetOverlay.classList.add("show");
  }
  function closeSheet() {
    $sheetOverlay.classList.remove("show");
    sheetCtx.pi = -1; sheetCtx.ti = -1;
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeSheet(); }
  });

  function openNameModal(kind) {
    var isNew = kind === "new";
    $modal.innerHTML =
      '<h3>' + (isNew ? "New project" : "Rename project") + '</h3>' +
      '<p>' + (isNew
        ? "Create a new project with the default JRiSpace checklist template."
        : "Change the display name of \"" + esc(current ? current.name : "") + "\".") + '</p>' +
      '<label style="font-size:12.5px;color:var(--muted);display:block;margin-bottom:4px;">Project name</label>' +
      '<input id="mName" type="text" value="' + (isNew ? "" : esc(current ? current.name : "")) + '" placeholder="e.g. ' + defaultProjectName() + '" />' +
      '<div class="m-actions">' +
        '<button id="mCancel">Cancel</button>' +
        '<button id="mSave" class="primary">' + (isNew ? "Create" : "Save") + '</button>' +
      '</div>';
    $overlay.classList.add("show");
    var $name = document.getElementById("mName");
    function closeModal() { $overlay.classList.remove("show"); }
    var _el_mCancel = document.getElementById("mCancel");

    if (_el_mCancel) _el_mCancel.addEventListener("click", closeModal);
    $overlay.addEventListener("click", function (e) { if (e.target === $overlay) closeModal(); });
    var _el_mSave = document.getElementById("mSave");

    if (_el_mSave) _el_mSave.addEventListener("click", function () {
      var v = $name.value.trim();
      if (!v) { $name.focus(); return; }
      if (isNew) {
        var key = slug(v);
        var suffix = 2;
        while (findProject(key)) key = slug(v) + "-" + (suffix++);
        var p = { key: key, name: v };
        registry.projects.push(p);
        saveRegistry();
        switchTo(key);
        saveCurrent(); /* ekri data a nan cache anvan kreye folder la */
        /* Kreye yon folder fizik sou disk (si DB konekte) + checklist.json andedan */
        if (db.ready && db.rootHandle) dbCreateProjectFolder(key, v);
      } else {
        current.name = v;
        saveRegistry();
        saveCurrent();
        renderSidebar();
      }
      closeModal();
      showToast(isNew ? 'Project "' + v + '" created' : 'Project renamed to "' + v + '"');
    });
    $name.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); document.getElementById("mSave").click(); } });
    setTimeout(function () { $name.focus(); $name.select(); }, 30);
  }

  /* ── Buttons ────────────────────────────────────────────────────────── */
  var _el_btnNewProject = document.getElementById("btnNewProject");

  if (_el_btnNewProject) _el_btnNewProject.addEventListener("click", function () { openNameModal("new"); });
  var _el_btnRenameProject = document.getElementById("btnRenameProject");

  if (_el_btnRenameProject) _el_btnRenameProject.addEventListener("click", function () { openNameModal("rename"); });

  /* Duplicate: kopi konplè pwojè aktyèl la (tasks, notes, priority, due dates) */
  var _el_btnDupProject = document.getElementById("btnDupProject");

  if (_el_btnDupProject) _el_btnDupProject.addEventListener("click", function () {
    if (!current) return;
    var base = current.name + " (copy)";
    var key = slug(base);
    var suffix = 2;
    while (findProject(key)) key = slug(base) + "-" + (suffix++);
    var copy = JSON.parse(JSON.stringify(current.data));
    copy.updatedAt = new Date().toISOString();
    copy._profileSynced = true; /* pa re-sync ankò */
    var p = { key: key, name: base };
    registry.projects.push(p);
    saveRegistry();
    try { localStorage.setItem(dataKey(key), JSON.stringify(copy)); } catch (e) {}
    switchTo(key);
    if (db.ready && db.rootHandle) dbCreateProjectFolder(key, base);
    showToast('⧉ Project duplicated as "' + base + '"');
  });

  var _el_btnDeleteProject = document.getElementById("btnDeleteProject");


  if (_el_btnDeleteProject) _el_btnDeleteProject.addEventListener("click", function () {
    if (!current) return;
    if (!confirm('Delete project "' + current.name + '"?\n\nThis removes its checklist data from this browser.')) return;
    var saved = { key: current.key, name: current.name, data: JSON.parse(JSON.stringify(current.data)) };
    localStorage.removeItem(dataKey(current.key));
    var idx = -1;
    for (var i = 0; i < registry.projects.length; i++) if (registry.projects[i].key === current.key) idx = i;
    if (idx >= 0) registry.projects.splice(idx, 1);
    saveRegistry();
    current = null;
    if (registry.projects.length) showProjects();
    else { migrateLegacyIfNeeded(); switchTo(registry.projects[0].key); }
    pushUndo('Project "' + saved.name + '" deleted', function () {
      if (!findProject(saved.key)) {
        registry.projects.push({ key: saved.key, name: saved.name });
        try { localStorage.setItem(dataKey(saved.key), JSON.stringify(saved.data)); } catch (e) {}
      }
      saveRegistry();
      switchTo(saved.key);
    });
  });

  /* Scan a folder: import every subproject (reads each folder's checklist.json) */
  /* Shared folder scan — used by the sidebar button AND the wizard */
  async function runScan() {
    if (!window.showDirectoryPicker) {
      showToast("Folder scanning needs Chrome/Edge. Otherwise use “+ New project” manually.");
      return false;
    }
    var dir;
    try { dir = await window.showDirectoryPicker({ mode: "readwrite" }); }
    catch (e) { return false; } /* user cancelled */

    /* Konekte disk DB a sou menm folder la (readwrite) — si poko konekte */
    if (!db.ready || !db.rootHandle) {
      try {
        db.rootHandle = dir;
        db.folderName = dir.name;
        db.ready = true;
        idbPut("root", dir);
        var loaded = await dbLoadFromDisk();
        if (!loaded) await dbWrite(); /* kreye jrispace-pm.db la premye fwa */
        renderDbBadge();
      } catch (err) { console.warn("db connect on scan failed:", err); }
    }

    var created = 0, loaded = 0;
    try {
      for await (var sub of dir.values()) {
        if (sub.kind !== "directory") continue;
        var key = slug(sub.name);
        if (!findProject(key)) {
          registry.projects.push({ key: key, name: sub.name });
          created++;
        }
        /* try to read a checklist.json inside the subproject */
        try {
          for await (var f of sub.values()) {
            if (f.kind !== "file") continue;
            var name = String(f.name || "");
            if (name === "checklist.json" || name.indexOf("jrispace-checklist") === 0) {
              var file = await f.getFile();
              var text = await file.text();
              var data = JSON.parse(text);
              if (data && Array.isArray(data.phases)) {
                data.project = sub.name;
                localStorage.setItem(dataKey(key), JSON.stringify(data));
                loaded++;
              }
              break;
            }
          }
        } catch (err) {}
      }
    } catch (err) {
      showToast("Scan failed: " + (err && err.message ? err.message : err));
      return false;
    }
    registry.folder = dir.name;
    saveRegistry();
    showToast('Scanned "' + dir.name + '": ' + created + " new project(s), " + loaded + " checklist(s) imported");
    switchTo(registry.projects[0].key);
    projBarPage = 1;
    if (currentView === "dashboard") renderDashboard();
    return { dir: dir.name, created: created, loaded: loaded };
  }
  var _el_btnScanFolder = document.getElementById("btnScanFolder");

  if (_el_btnScanFolder) _el_btnScanFolder.addEventListener("click", function () { runScan(); });

  /* ⟳ Verify — re-sync project against its known profile (if any) */
  var _el_btnSyncProfile = document.getElementById("btnSyncProfile");

  if (_el_btnSyncProfile) _el_btnSyncProfile.addEventListener("click", function () {
    if (!current) { showToast("No project selected"); return; }
    var r = syncProjectProfile(current);
    if (!r) { showToast("No verified profile for “" + current.name + "” yet"); return; }
    if (r.added || r.marked) {
      current.data.updatedAt = new Date().toISOString();
      saveCurrent();
      showToast("✓ Verified: +" + r.added + " tasks added, " + r.marked + " marked done");
    } else {
      showToast("✓ " + current.name + " is up to date with its profile");
    }
    renderPhases();
  });

  var _el_btnAddPhase = document.getElementById("btnAddPhase");


  if (_el_btnAddPhase) _el_btnAddPhase.addEventListener("click", function () {
    $modal.innerHTML =
      '<h3>New phase</h3>' +
      '<label style="font-size:12.5px;color:var(--muted);display:block;margin-bottom:4px;">Phase name</label>' +
      '<input id="mPName" type="text" placeholder="e.g. Launch & Marketing" />' +
      '<label style="font-size:12.5px;color:var(--muted);display:block;margin:10px 0 4px;">Description (optional)</label>' +
      '<textarea id="mPDesc" style="min-height:52px;" placeholder="Short description…"></textarea>' +
      '<div class="m-actions">' +
        '<button id="mCancel">Cancel</button>' +
        '<button id="mSave" class="primary">Add phase</button>' +
      '</div>';
    $overlay.classList.add("show");
    var $name = document.getElementById("mPName");
    function closeModal() { $overlay.classList.remove("show"); }
    var _el_mCancel = document.getElementById("mCancel");

    if (_el_mCancel) _el_mCancel.addEventListener("click", closeModal);
    $overlay.addEventListener("click", function (e) { if (e.target === $overlay) closeModal(); });
    var _el_mSave = document.getElementById("mSave");

    if (_el_mSave) _el_mSave.addEventListener("click", function () {
      var v = $name.value.trim();
      if (!v) { $name.focus(); return; }
      current.data.phases.push({ name: v, desc: document.getElementById("mPDesc").value.trim() || undefined, tasks: [] });
      saveCurrent(); closeModal(); renderPhases();
    });
    $name.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); document.getElementById("mSave").click(); } });
    setTimeout(function () { $name.focus(); }, 30);
  });

  /* ── Search: filtre tasks yo (nan pwojè aktyèl la) ─────────────────── */
  var $taskSearch = document.getElementById("taskSearch");
  if ($taskSearch) {
    $taskSearch.addEventListener("input", function () {
      searchQuery = $taskSearch.value.trim().toLowerCase();
    });
    $taskSearch.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && $taskSearch.value.trim()) {
        var q = $taskSearch.value.trim().toLowerCase();
        var found = current.data.phases.find(function (p) { return p.name.toLowerCase().indexOf(q) >= 0; });
        if (found) {
          var pi = current.data.phases.indexOf(found);
          current.data.phases[pi]._open = true;
          renderPhases();
        }
      }
    });
  }
  var $taskSearchDetail = document.getElementById("taskSearchDetail");
  if ($taskSearchDetail) {
    $taskSearchDetail.addEventListener("input", function () {
      var q = $taskSearchDetail.value.trim().toLowerCase();
      renderPhases();
    });
  }

  /* ── Tasks page filters ───────────────────────────────────────── */
  var $taskFilterProject = document.getElementById("taskFilterProject");
  var $taskFilterStatus = document.getElementById("taskFilterStatus");
  var $taskSearchGlobal = document.getElementById("taskSearchGlobal");
  if ($taskFilterProject) $taskFilterProject.addEventListener("change", function () { renderTasksPage(); });
  if ($taskFilterStatus) $taskFilterStatus.addEventListener("change", function () { renderTasksPage(); });
  if ($taskSearchGlobal) $taskSearchGlobal.addEventListener("input", function () { renderTasksPage(); });

  /* ── Activity Log rendering & controls ─────────────────────────────── */
  function renderActivityLog(filter) {
    var $list = document.getElementById("activityList");
    if (!$list) return;
    var items = activityLog;
    if (filter) {
      var q = filter.toLowerCase();
      items = items.filter(function (a) {
        return a.text.toLowerCase().indexOf(q) !== -1 || (a.project && a.project.toLowerCase().indexOf(q) !== -1);
      });
    }
    if (items.length === 0) {
      $list.innerHTML = '<div class="activity-empty">' +
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' +
        '<div style="font-size:14px;margin-top:8px;">No activity yet</div>' +
        '<div style="font-size:12px;margin-top:4px;">Actions like creating, completing, or editing tasks will appear here.</div></div>';
      return;
    }
    var html = '';
    items.slice(0, 200).forEach(function (a) {
      html += '<div class="activity-item">';
      html += '<div class="activity-dot ' + (a.type || "edited") + '"></div>';
      html += '<div class="activity-body">';
      html += '<div class="activity-text">' + a.text;
      if (a.project) html += '<span class="activity-project-tag">' + esc(a.project) + '</span>';
      html += '</div>';
      html += '<div class="activity-time">' + timeAgo(a.time) + '</div>';
      html += '</div></div>';
    });
    $list.innerHTML = html;
  }

  var $activitySearch = document.getElementById("activitySearch");
  if ($activitySearch) $activitySearch.addEventListener("input", function () {
    renderActivityLog($activitySearch.value.trim());
  });
  var $btnClearActivity = document.getElementById("btnClearActivity");
  if ($btnClearActivity) $btnClearActivity.addEventListener("click", function () {
    if (confirm("Clear all activity log entries?")) {
      activityLog = [];
      saveActivityLog();
      renderActivityLog();
      showToast("Activity log cleared");
    }
  });

  var _el_btnReset = document.getElementById("btnReset");


  if (_el_btnReset) _el_btnReset.addEventListener("click", function () {
    if (!current) return;
    if (confirm('Reset the checklist for "' + current.name + '" to the default JRiSpace template?')) {
      current.data = scaffold(current.name);
      saveCurrent(); renderPhases(); showToast("Project reset to default template");
    }
  });

  var _el_btnExport = document.getElementById("btnExport");


  if (_el_btnExport) _el_btnExport.addEventListener("click", function () {
    if (!current) return;
    var blob = new Blob([JSON.stringify(current.data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "checklist.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast("Exported as checklist.json — save it inside your project folder for Scan");
  });

  var _el_btnImport = document.getElementById("btnImport");


  if (_el_btnImport) _el_btnImport.addEventListener("click", function () { $fileInput.click(); });
  $fileInput.addEventListener("change", function () {
    var file = $fileInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.phases)) throw new Error("Not a checklist file (missing 'phases' array).");
        if (!current) throw new Error("No active project.");
        data.project = current.name;
        current.data = data;
        saveCurrent(); renderPhases();
        showToast('Checklist loaded into "' + current.name + '"');
      } catch (e) { showToast("Import failed: " + (e && e.message ? e.message : e)); }
    };
    reader.readAsText(file);
    $fileInput.value = "";
  });

  /* ── Toast ──────────────────────────────────────────────────────────── */
  function showToast(msg, undoFn) {
    $toast.textContent = msg;
    $toast.classList.add("show");
    if (undoFn) {
      var u = document.createElement("button");
      u.className = "toast-undo";
      u.textContent = "Undo";
      u.addEventListener("click", function () {
        $toast.classList.remove("show");
        undoFn();
      });
      $toast.appendChild(u);
    }
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $toast.classList.remove("show"); }, 4000);
  }

  /* ── Undo stack: delete operations yo ka restore ───────────────────── */
  var undoStack = [];
  function pushUndo(label, restoreFn) {
    undoStack.push({ label: label, fn: restoreFn });
    if (undoStack.length > 10) undoStack.shift();
    showToast(label + " — ", function () {
      var op = undoStack.pop();
      if (op) op.fn();
    });
  }

  /* ── Dashboard: charts & reports for ALL projects ──────────────────── */
  var $dashboard = document.getElementById("dashboard");
  var $settingsPage = document.getElementById("settingsPage");
  var $checklistPage = document.getElementById("checklistPage");
  var $tasksPage = document.getElementById("tasksPage");
  var $summaryBar = document.getElementById("summaryBar");
  var $btnViewChecklist = document.getElementById("btnViewChecklist");
  var $btnViewDashboard = document.getElementById("btnViewDashboard");
  var currentView = "checklist"; /* checklist | dashboard */

  function projectStats(proj) {
    var data = loadProjectData(proj.key, proj.name);
    var total = 0, done = 0, phases = [];
    data.phases.forEach(function (p) {
      var t = p.tasks.length;
      var d = p.tasks.filter(function (x) { return x.done; }).length;
      total += t; done += d;
      phases.push({ name: p.name || "Phase", total: t, done: d, pct: t ? Math.round(d / t * 100) : 0 });
    });
    return { name: proj.name, key: proj.key, total: total, done: done, pct: total ? Math.round(done / total * 100) : 0, phases: phases, updatedAt: data.updatedAt };
  }

  function allStats() {
    var list = registry.projects.map(projectStats);
    var t = 0, d = 0;
    list.forEach(function (s) { t += s.total; d += s.done; });
    return { projects: list, total: t, done: d, pct: t ? Math.round(d / t * 100) : 0 };
  }

  var projBarPage = 1;
  var PROJ_PAGE_SIZE = 7;
  var reportsPage = 1; /* galri Project Reports — pagination state */

  /* ── System Health card (done soti nan ai-self-review.sh) ──────────── */
  function renderHealth() {
    var body = document.getElementById("healthBody");
    var stamp = document.getElementById("healthStamp");
    var h = window.JRISRACE_HEALTH;
    if (!h) {
      body.innerHTML = '<p style="color:var(--danger);font-size:13px;">⚠️ system-health.js pa jwenn — kouri <code>~/scripts/ai-self-review.sh</code> pou jenere l.</p>';
      return;
    }
    stamp.textContent = "· " + (h.generatedAt || "");

    var chips = [];
    var p = h.policies || {};
    chips.push('<span class="chip ' + (p.rules ? "chip-ok" : "chip-bad") + '">📜 rules.md</span>');
    chips.push('<span class="chip ' + (p.charter ? "chip-ok" : "chip-bad") + '">📕 Charter</span>');
    chips.push('<span class="chip ' + (p.policy ? "chip-ok" : "chip-bad") + '">⚖️ Policy</span>');

    var s = h.services || {};
    var svc = [
      ["charterWatch", "Charter watcher"], ["watchdog", "Watchdog"],
      ["htmlRefresh", "HTML refresh"], ["selfReview", "Self-review"], ["autoOrganize", "Auto-organize"]
    ];
    var svcHtml = svc.map(function (x) {
      return '<span class="chip ' + (s[x[0]] ? "chip-ok" : "chip-bad") + '">' + x[1] + '</span>';
    }).join("");

    var hh = h.health || {};
    var disk = hh.diskPct || 0;
    var diskChip = disk >= 85 ? "chip-bad" : disk >= 70 ? "chip-warn" : "chip-ok";
    var batt = hh.battery == null ? "—" : hh.battery + "%";

    body.innerHTML =
      '<div class="health-grid">' +
        '<div class="health-col"><div class="health-label">📜 Politik</div><div class="chips">' + chips.join("") + '</div></div>' +
        '<div class="health-col"><div class="health-label">⚙️ Services</div><div class="chips">' + svcHtml + '</div></div>' +
        '<div class="health-col"><div class="health-label">💻 Sante</div><div class="chips">' +
          '<span class="chip ' + diskChip + '">💾 Disk ' + disk + '%</span>' +
          '<span class="chip chip-ok">🔋 ' + batt + '</span>' +
          '<span class="chip ' + (hh.desktopLoose > 10 ? "chip-warn" : "chip-ok") + '">🖥️ ' + (hh.desktopLoose || 0) + ' lage Desktop</span>' +
          '<span class="chip chip-ok">📥 ' + (hh.downloads || 0) + ' Downloads</span>' +
          (hh.projectsNoAgents ? '<span class="chip chip-warn">⚠️ ' + hh.projectsNoAgents + ' pwojè san AGENTS.md</span>' : '<span class="chip chip-ok">✓ Tout pwojè gen AGENTS.md</span>') +
        '</div></div>' +
      '</div>';
  }

  /* ── Modal detay pwojè (klike sou ikon galri a) ────────────────────── */
  function showProjectModal(s) {
    var rows = (s.phases || []).map(function (p) {
      var done = p.pct === 100 && p.total > 0;
      return '<div class="rep' + (done ? " open" : "") + '">' +
        '<div class="rep-head"><b>' + esc(p.name) + '</b><span class="rep-pct">' + p.pct + '%</span></div>' +
        '<div class="rep-body"><table><thead><tr><th>Phase</th><th>Tasks</th><th></th><th>%</th></tr></thead><tbody>' +
        '<tr><td>' + esc(p.name) + '</td><td>' + p.done + ' / ' + p.total + '</td>' +
        '<td><div class="rep-mini"><div style="width:' + p.pct + '%"></div></div></td><td><b>' + p.pct + '%</b></td></tr>' +
        '</tbody></table></div></div>';
    }).join("") || '<p style="color:var(--muted);font-size:13px;">No tasks yet</p>';

    var m = $modal;
    m.innerHTML =
      '<h3>📁 ' + esc(s.name) + ' <span style="font-weight:500;font-size:13px;color:var(--muted);">' + s.pct + '% · ' + s.done + '/' + s.total + ' tasks</span></h3>' +
      '<div style="max-height:60vh;overflow-y:auto;margin-top:10px;">' + rows + '</div>' +
      '<div class="m-actions">' +
        '<button id="mClose">Close</button>' +
        '<button id="mOpenProject" class="primary">Open in checklist →</button>' +
      '</div>';
    $overlay.classList.add("show");

    function close() { $overlay.classList.remove("show"); }
    var _el_mClose = document.getElementById("mClose");

    if (_el_mClose) _el_mClose.addEventListener("click", close);
    $overlay.addEventListener("click", function (e) { if (e.target === $overlay) close(); });
    var _el_mOpenProject = document.getElementById("mOpenProject");

    if (_el_mOpenProject) _el_mOpenProject.addEventListener("click", function () {
      close();
      switchTo(s.key);
      setView("checklist");
    });
  }

  function renderDashboard() {
    var all = allStats();
    var kpis = document.getElementById("dashKpis");
    kpis.innerHTML =
      '<div class="kpi"><div class="k-val">' + all.projects.length + '</div><div class="k-label">Projects</div></div>' +
      '<div class="kpi"><div class="k-val">' + all.total + '</div><div class="k-label">Total tasks</div></div>' +
      '<div class="kpi"><div class="k-val">' + all.done + '</div><div class="k-label">Completed</div></div>' +
      '<div class="kpi"><div class="k-val">' + all.pct + '%</div><div class="k-label">Overall</div></div>' +
      '<div class="kpi"><div class="k-val">' + all.projects.filter(function (s) { return s.pct === 100 && s.total > 0; }).length + '</div><div class="k-label">Done projects</div></div>' +
      '<div class="kpi"><div class="k-val">' + all.projects.filter(function (s) { return s.pct < 100 && s.total > 0; }).length + '</div><div class="k-label">In progress</div></div>';

    var C = 351.86; /* 2 * PI * 56 */
    document.getElementById("donutFg").style.strokeDashoffset = (C * (1 - all.pct / 100)).toFixed(1);
    document.getElementById("donutTxt").textContent = all.pct + "%";
    document.getElementById("donutLegend").textContent = all.done + " / " + all.total + " tasks done across " + all.projects.length + " project(s)";

    /* Progress by Project — paginated (7 per page) */
    var bars = document.getElementById("projBars");
    var pageCount = Math.max(1, Math.ceil(all.projects.length / PROJ_PAGE_SIZE));
    if (projBarPage > pageCount) projBarPage = pageCount;
    var start = (projBarPage - 1) * PROJ_PAGE_SIZE;
    var slice = all.projects.slice(start, start + PROJ_PAGE_SIZE);
    bars.innerHTML = slice.map(function (s) {
      return '<div class="proj-bar-row">' +
        '<div class="proj-bar-head"><b>' + esc(s.name) + '</b><span>' + s.done + '/' + s.total + ' · ' + s.pct + '%</span></div>' +
        '<div class="proj-track"><div style="width:' + s.pct + '%"></div></div>' +
      '</div>';
    }).join("") || '<p style="color:var(--muted);font-size:13px;">No projects yet — scan a folder first.</p>';
    if (all.projects.length > PROJ_PAGE_SIZE) {
      bars.insertAdjacentHTML("beforeend",
        '<div class="pager">' +
          '<button class="mini" data-pg="prev"' + (projBarPage <= 1 ? " disabled" : "") + '>‹ Prev</button>' +
          '<span class="pager-info">Page ' + projBarPage + ' / ' + pageCount + ' · ' + all.projects.length + ' projects</span>' +
          '<button class="mini" data-pg="next"' + (projBarPage >= pageCount ? " disabled" : "") + '>Next ›</button>' +
        '</div>');
    }

    var reports = document.getElementById("dashReports");

    /* Project Reports — gallery (icon view) + pagination */
    var GALLERY_PAGE_SIZE = 12;
    var repPageCount = Math.max(1, Math.ceil(all.projects.length / GALLERY_PAGE_SIZE));
    if (reportsPage > repPageCount) reportsPage = repPageCount;
    var rStart = (reportsPage - 1) * GALLERY_PAGE_SIZE;
    var rSlice = all.projects.slice(rStart, rStart + GALLERY_PAGE_SIZE);

    reports.innerHTML =
      '<div class="gallery">' + rSlice.map(function (s) {
        var done = s.pct === 100 && s.total > 0;
        var ico = done ? "🏆" : (s.pct > 0 ? "📁" : "🗂️");
        return '<div class="g-item' + (done ? " done" : "") + '" data-gkey="' + esc(s.key) + '" title="' + esc(s.name) + ' — ' + s.pct + '%">' +
          '<div class="g-ico">' + ico + '</div>' +
          '<span class="g-name">' + esc(s.name) + '</span>' +
          '<span class="g-pct">' + s.pct + '% · ' + s.done + '/' + s.total + '</span>' +
          '<div class="g-track"><div style="width:' + s.pct + '%"></div></div>' +
        '</div>';
      }).join("") + '</div>' +
      (repPageCount > 1
        ? '<div class="pager">' +
          '<button class="mini" data-rpg="prev"' + (reportsPage <= 1 ? " disabled" : "") + '>‹ Prev</button>' +
          '<span class="pager-info">Page ' + reportsPage + ' / ' + repPageCount + ' · ' + all.projects.length + ' projects</span>' +
          '<button class="mini" data-rpg="next"' + (reportsPage >= repPageCount ? " disabled" : "") + '>Next ›</button>' +
          '</div>'
        : '');

    reports.querySelectorAll(".g-item").forEach(function (item) {
      item.addEventListener("click", function () {
        var key = item.dataset.gkey;
        var s = all.projects.filter(function (x) { return x.key === key; })[0];
        if (s) showProjectModal(s);
      });
    });
    reports.querySelectorAll("[data-rpg]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        reportsPage += (b.dataset.rpg === "prev" ? -1 : 1);
        renderDashboard();
      });
    });

    renderHealth();
  }

  function buildMarkdownReport() {
    var all = allStats();
    var lines = [];
    lines.push("# " + (config.company || "JRiSpace") + " Project Report");
    lines.push("");
    lines.push("- Root: " + (registry.folder || "~/Projects"));
    lines.push("- Generated: " + new Date().toLocaleString());
    lines.push("- Projects: " + all.projects.length + " | Tasks: " + all.done + "/" + all.total + " (" + all.pct + "%)");
    lines.push("");
    all.projects.forEach(function (s) {
      lines.push("## " + s.name + " — " + s.pct + "% (" + s.done + "/" + s.total + ")");
      s.phases.forEach(function (p) {
        lines.push("- " + (p.pct === 100 && p.total > 0 ? "[x]" : "[ ]") + " " + p.name + ": " + p.done + "/" + p.total + " (" + p.pct + "%)");
      });
      lines.push("");
    });
    return lines.join("\n");
  }

  var _el_projBars = document.getElementById("projBars");


  if (_el_projBars) _el_projBars.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-pg]");
    if (!btn || btn.disabled) return;
    if (btn.dataset.pg === "prev") projBarPage--;
    else projBarPage++;
    renderDashboard();
  });

  var _el_btnCopyReport = document.getElementById("btnCopyReport");


  if (_el_btnCopyReport) _el_btnCopyReport.addEventListener("click", function () {
    var text = buildMarkdownReport();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); showToast("Report copied to clipboard"); }
      catch (e) { showToast("Copy failed — select manually"); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showToast("Report copied to clipboard"); }, fallback);
    } else fallback();
  });

  /* ── View management ──────────────────────────────────────────── */
  var $projectsPage = document.getElementById("projectsPage");
  var $projectPage = document.getElementById("projectPage");
  var $phasesDetail = document.getElementById("phasesDetail");
  var $headProjectDetail = document.getElementById("headProjectDetail");
  var $subProjectDetail = document.getElementById("subProjectDetail");
  var $globalPctDetail = document.getElementById("globalPctDetail");
  var $globalTrackDetail = document.getElementById("globalTrackDetail");
  var $globalCountsDetail = document.getElementById("globalCountsDetail");
  var $taskSearchDetail = document.getElementById("taskSearchDetail");
  if ($taskSearchDetail) {
    $taskSearchDetail.addEventListener("input", function () {
      var q = $taskSearchDetail.value.trim().toLowerCase();
      if (q && current) {
        current.data.phases.forEach(function (phase) {
          var found = phase.tasks.some(function (t) { return t.text.toLowerCase().indexOf(q) >= 0; });
          phase._searchMatch = found;
        });
        renderPhasesDetail();
      }
    });
  }
  var $summaryBarDetail = document.getElementById("summaryBarDetail");
  var currentView = "checklist"; /* dashboard | projects | project */
  var projectsPageRefreshTimer = null;

  function renderProjectsPage() {
    var grid = document.getElementById("projectsGrid");
    if (!registry.projects.length) {
      grid.innerHTML = '<div class="project-card empty"><p>No projects yet.<br>Click <b>+ New Project</b> or scan a folder to get started.</p></div>';
      return;
    }
    grid.innerHTML = registry.projects.map(function (p) {
      var stats = projectStats(p);
      return '<div class="project-card" data-pkey="' + esc(p.key) + '">' +
        '<div class="pc-name">' + esc(p.name) + '</div>' +
        '<div class="pc-desc">Project checklist with ' + stats.phases.length + ' phases</div>' +
        '<div class="pc-stats">' +
          '<span><b>' + stats.done + '</b> done</span>' +
          '<span><b>' + stats.total + '</b> total</span>' +
          '<span><b>' + stats.pct + '%</b> progress</span>' +
        '</div>' +
        '<div class="pc-bar"><div style="width:' + stats.pct + '%"></div></div>' +
      '</div>';
    }).join("");
    grid.querySelectorAll(".project-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var key = card.dataset.pkey;
        if (key) switchToProject(key);
      });
    });
  }

  function switchToProject(key) {
    var p = findProject(key);
    if (!p) return;
    p.data = loadProjectData(p.key, p.name);
    current = p;
    currentView = "project";
    $dashboard.hidden = true;
    $projectsPage.hidden = true;
    $projectPage.hidden = false;
    if ($checklistPage) $checklistPage.hidden = true;
    if ($tasksPage) $tasksPage.hidden = true;
    if ($settingsPage) $settingsPage.hidden = true;
    if ($headProjectDetail) $headProjectDetail.textContent = p.name;
    if ($subProjectDetail) $subProjectDetail.textContent = p.data.phases.length + " phases · click a task for details";
    updateProjectSummary();
    renderPhasesDetail();
    if (window.innerWidth <= 900) closeDrawer();
  }

  function showProjects() {
    currentView = "projects";
    $dashboard.hidden = true;
    $projectsPage.hidden = false;
    $projectPage.hidden = true;
    if ($checklistPage) $checklistPage.hidden = true;
    if ($tasksPage) $tasksPage.hidden = true;
    if ($settingsPage) $settingsPage.hidden = true;
    renderProjectsPage();
  }

  function backToProjects() {
    currentView = "projects";
    $projectPage.hidden = true;
    $projectsPage.hidden = false;
    if ($checklistPage) $checklistPage.hidden = true;
    if ($tasksPage) $tasksPage.hidden = true;
    if ($settingsPage) $settingsPage.hidden = true;
    current = null;
    renderProjectsPage();
  }

  function updateProjectSummary() {
    if (!current) return;
    var data = current.data;
    var total = 0, done = 0;
    data.phases.forEach(function (p) {
      total += p.tasks.length;
      done += p.tasks.filter(function (x) { return x.done; }).length;
    });
    var pct = total ? Math.round(done / total * 100) : 0;
    if ($globalPctDetail) $globalPctDetail.textContent = pct + "%";
    if ($globalTrackDetail) $globalTrackDetail.style.width = pct + "%";
    if ($globalCountsDetail) $globalCountsDetail.textContent = done + " / " + total + " tasks";
  }

  function renderPhasesDetail() {
    $phasesDetail.innerHTML = "";
    if (!current || !current.data.phases.length) {
      $phasesDetail.innerHTML = '<div class="phase"><div class="phase-head"><div class="phase-info"><div class="phase-name">No phases yet</div><div class="phase-desc">Use <b>+ Phase</b> to add one.</div></div></div></div>';
      return;
    }
    current.data.phases.forEach(function (phase, pi) {
      var prog = phaseProgress(phase);
      var open = phase._open !== false;
      var card = document.createElement("section");
      card.className = "phase" + (open ? " open" : "");
      var head = document.createElement("div");
      head.className = "phase-head";
      head.innerHTML = '<span class="chev">▶</span><div class="phase-info"><div class="phase-name">' + esc(phase.name || "Phase " + (pi + 1)) + '</div>' + (phase.desc ? '<div class="phase-desc">' + esc(phase.desc) + '</div>' : "") + '</div><div class="phase-meta"><div class="mini-track"><div style="width:' + prog.pct + '%"></div></div><span class="pchip' + (prog.done && prog.done === prog.total ? ' done' : '') + '">' + prog.done + '/' + prog.total + ' · ' + prog.pct + '%</span></div>';
      head.addEventListener("click", function () {
        phase._open = phase._open === false ? true : false;
        saveCurrent(); renderPhasesDetail();
      });
      card.appendChild(head);
      var body = document.createElement("div");
      body.className = "phase-body";
      var ul = document.createElement("ul");
      ul.className = "tasks";
      /* Filter tasks by search query */
      var q = $taskSearchDetail ? $taskSearchDetail.value.trim().toLowerCase() : "";
      phase.tasks.forEach(function (task, ti) {
        if (q && task.text.toLowerCase().indexOf(q) < 0 && phase._searchMatch !== false) {
          /* Skip non-matching tasks unless this phase has a match */
          if (!phase._searchMatch) return;
        }
        var li = document.createElement("li");
        li.className = "task" + (task.done ? " done" : "") + (isOverdue(task) ? " overdue" : "");
        li.setAttribute("role", "button");
        li.setAttribute("tabindex", "0");
        li.setAttribute("aria-label", (task.done ? "Done: " : "Open: ") + (task.text || ""));
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!task.done;
        cb.addEventListener("click", function (e) { e.stopPropagation(); });
        cb.addEventListener("change", function () {
          task.done = cb.checked;
          saveCurrent(); renderPhasesDetail(); updateProjectSummary();
        });
        var label = document.createElement("div");
        label.className = "t-label";
        var prio = prioLabel(task.priority);
        if (prio || task.dueDate) {
          var meta = document.createElement("div");
          meta.className = "t-meta";
          if (prio) {
            var pb = document.createElement("span");
            pb.className = "prio p-" + task.priority;
            pb.textContent = prio;
            pb.title = "Priority: " + task.priority;
            meta.appendChild(pb);
          }
          if (task.dueDate) {
            var db = document.createElement("span");
            db.className = "due" + (isOverdue(task) ? " overdue" : "");
            db.textContent = "📅 " + task.dueDate + (isOverdue(task) ? " ⚠" : "");
            db.title = isOverdue(task) ? "Overdue" : "Due date";
            meta.appendChild(db);
          }
          label.appendChild(meta);
        }
        label.appendChild(document.createTextNode(task.text || ""));
        if (task.subtasks && task.subtasks.length) {
          var stDone = task.subtasks.filter(function (s) { return s.done; }).length;
          var st = document.createElement("div");
          st.className = "t-notes";
          st.style.color = "var(--brand)";
          st.textContent = "▸ " + stDone + "/" + task.subtasks.length + " sub-tasks";
          label.appendChild(st);
        }
        label.addEventListener("click", function () { openTaskSheet(pi, ti); });
        var btns = document.createElement("div");
        btns.className = "t-btns";
        var btnEdit = document.createElement("button");
        btnEdit.className = "edit"; btnEdit.textContent = "Edit";
        btnEdit.addEventListener("click", function (e) { e.stopPropagation(); openTaskModal(pi, ti); });
        var btnDel = document.createElement("button");
        btnDel.className = "del"; btnDel.textContent = "✕";
        btnDel.title = "Delete task";
        btnDel.setAttribute("aria-label", "Delete task: " + (task.text || ""));
        btnDel.addEventListener("click", function (e) {
          e.stopPropagation();
          var saved = { pi: pi, ti: ti, task: JSON.parse(JSON.stringify(task)) };
          phase.tasks.splice(ti, 1); saveCurrent(); renderPhasesDetail(); updateProjectSummary();
          pushUndo("Task deleted", function () {
            current.data.phases[saved.pi].tasks.splice(Math.min(saved.ti, current.data.phases[saved.pi].tasks.length), 0, saved.task);
            saveCurrent(); renderPhasesDetail(); updateProjectSummary();
          });
        });
        btns.appendChild(btnEdit);
        btns.appendChild(btnDel);
        li.appendChild(cb);
        li.appendChild(label);
        li.appendChild(btns);
        ul.appendChild(li);
      });
      body.appendChild(ul);
      var row = document.createElement("div");
      row.className = "add-row";
      var input = document.createElement("input");
      input.placeholder = "Add a task to " + (phase.name || "phase");
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && input.value.trim()) {
          var task = { text: input.value.trim(), done: false, createdAt: new Date().toISOString(), createdBy: config.company || "Me", scope: phase.name, status: "open" };
          phase.tasks.push(task);
          saveCurrent(); renderPhasesDetail(); updateProjectSummary();
          input.value = "";
        }
      });
      var btn = document.createElement("button");
      btn.className = "primary"; btn.textContent = "Add";
      btn.addEventListener("click", function () {
        if (input.value.trim()) {
          var task = { text: input.value.trim(), done: false, createdAt: new Date().toISOString(), createdBy: config.company || "Me", scope: phase.name, status: "open" };
          phase.tasks.push(task);
          saveCurrent(); renderPhasesDetail(); updateProjectSummary();
          input.value = "";
        }
      });
      row.appendChild(input);
      row.appendChild(btn);
      body.appendChild(row);
      card.appendChild(body);
      $phasesDetail.appendChild(card);
    });
  }

  function setView(view) {
    currentView = view;
    var isDash = view === "dashboard";
    var isProj = view === "projects";
    var isDetail = view === "project";
    var isCheck = view === "checklist";
    var isTasks = view === "tasks";
    var isActivity = view === "activity";
    var isSettings = view === "settings";
    $dashboard.hidden = !isDash;
    $projectsPage.hidden = !isProj;
    $projectPage.hidden = !isDetail;
    if ($checklistPage) $checklistPage.hidden = !isCheck;
    if ($tasksPage) $tasksPage.hidden = !isTasks;
    var $activityPage = document.getElementById("activityPage");
    if ($activityPage) $activityPage.hidden = !isActivity;
    if ($settingsPage) $settingsPage.hidden = !isSettings;
    if (isDash) renderDashboard();
    if (isProj) renderProjectsPage();
    if (isCheck) {
      var g = globalProgress();
      if ($pct) $pct.textContent = g.pct + "%";
      if ($track) $track.style.width = g.pct + "%";
      if ($counts) $counts.textContent = g.done + " / " + g.total + " tasks";
      renderPhases();
    }
    if (isTasks) renderTasksPage();
    if (isActivity) renderActivityLog();
    if (isDetail && current) {
      if ($headProjectDetail) $headProjectDetail.textContent = current.name;
      updateProjectSummary();
      renderPhasesDetail();
    }
    /* Update sidebar active state */
    var activeId = view === "dashboard" ? "btnViewDashboard" : view === "projects" ? "btnViewProjects" : view === "checklist" ? "btnViewChecklist" : view === "tasks" ? "btnViewTasks" : view === "activity" ? "btnViewActivity" : view === "settings" ? "btnSettingsPage" : "btnViewDashboard";
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(function (b) {
      b.classList.toggle("active", b.id === activeId);
    });
    /* Update header title */
    var titles = { dashboard: "Dashboard", projects: "All Projects", project: "Project Detail", checklist: "Checklist", tasks: "All Tasks", activity: "Activity Log", settings: "Settings" };
    var $headerTitle = document.getElementById("headerTitle");
    if ($headerTitle) $headerTitle.textContent = titles[view] || "Dashboard";
  }
  if ($btnViewChecklist) $btnViewChecklist.addEventListener("click", function () { setView("checklist"); });
  if ($btnViewDashboard) $btnViewDashboard.addEventListener("click", function () { setView("dashboard"); });
  var $btnViewTasks = document.getElementById("btnViewTasks");
  if ($btnViewTasks) $btnViewTasks.addEventListener("click", function () { setView("tasks"); });
  var $btnViewActivity = document.getElementById("btnViewActivity");
  if ($btnViewActivity) $btnViewActivity.addEventListener("click", function () { setView("activity"); });
  var $btnSettingsPage = document.getElementById("btnSettingsPage");
  if ($btnSettingsPage) $btnSettingsPage.addEventListener("click", function () { setView("settings"); });

  /* ── App config & branding ──────────────────────────────────────────── */
  var CONFIG_KEY = "jrispace.config.v1";
  var config = { company: "Local Projects Manager", author: "Sylvenson Richard", website: "jrispace.com", launched: false, skipped: false };
  try {
    var savedConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
    if (savedConfig && typeof savedConfig === "object") {
      for (var k in savedConfig) config[k] = savedConfig[k];
    }
  } catch (e) {}
  function saveConfig() { try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch (e) {} dbScheduleSave(); }

  function applyBrand() {
    var company = config.company || "Local Projects Manager";
    document.title = company + " Project Manager — Multi-project";
    document.querySelectorAll("[data-brand]").forEach(function (el) {
      var key = el.getAttribute("data-brand");
      if (key === "company") el.textContent = company;
      else if (key === "website") el.textContent = config.website || "jrispace.com";
      else if (key === "author") el.textContent = config.author || "Sylvenson Richard";
    });
    var badge = document.getElementById("sideBadge");
    if (badge) badge.textContent = "v2.4 · " + company + " | " + (config.author || "Sylvenson Richard");
    var prev = document.getElementById("wizBrandPrev");
    if (prev) prev.textContent = company;
  }

  /* ── Launch wizard ──────────────────────────────────────────────────── */
  var $wizard = document.getElementById("launchWizard");
  var $wizCompany = document.getElementById("wizCompany");
  var wizSteps = [1, 2, 3, 4].map(function (n) { return document.getElementById("wizStep" + n); });
  function wizShowStep(n) {
    wizSteps.forEach(function (s, i) { s.style.display = i + 1 === n ? "" : "none"; });
    [1, 2, 3, 4].forEach(function (i) {
      document.getElementById("wizDot" + i).className = i === n ? "on" : "";
    });
  }
  function openWizard() {
    $wizCompany.value = config.company || "";
    document.getElementById("wizRootPrev").textContent = "📁 " + (registry.folder || "~/Projects");
    document.getElementById("wizRootInfo").textContent = "";
    if (config.company && config.company !== "JRiSpace") wizShowStep(2);
    else wizShowStep(1);
    $wizard.classList.add("open");
  }
  function closeWizard() { $wizard.classList.remove("open"); }
  function finishWizard() {
    var v = $wizCompany.value.trim();
    if (v) config.company = v;
    config.launched = true;
    saveConfig();
    applyBrand();
    document.getElementById("wizDoneMsg").textContent =
      v ? 'Your workspace is now branded as "' + esc(v) + '".' : 'Kept "JRiSpace" as your company name.';
    wizShowStep(4);
  }
  var _el_wizNext1 = document.getElementById("wizNext1");

  if (_el_wizNext1) _el_wizNext1.addEventListener("click", function () {
    wizShowStep(2);
    setTimeout(function () { $wizCompany.focus(); $wizCompany.select(); }, 60);
  });
  var _el_wizBack = document.getElementById("wizBack");

  if (_el_wizBack) _el_wizBack.addEventListener("click", function () { wizShowStep(1); });
  var _el_wizFinish = document.getElementById("wizFinish");

  if (_el_wizFinish) _el_wizFinish.addEventListener("click", function () { wizShowStep(3); });
  var _el_wizBack3 = document.getElementById("wizBack3");

  if (_el_wizBack3) _el_wizBack3.addEventListener("click", function () { wizShowStep(2); });
  var _el_wizScan = document.getElementById("wizScan");

  if (_el_wizScan) _el_wizScan.addEventListener("click", function () {
    var info = document.getElementById("wizRootInfo");
    info.className = "wiz-root-info";
    if (!window.showDirectoryPicker) {
      info.textContent = "Folder scanning needs Chrome/Edge — you can skip this step.";
      info.className = "wiz-root-info err";
      return;
    }
    info.textContent = "Scanning…";
    runScan().then(function (res) {
      if (!res) { info.textContent = "No folder selected."; info.className = "wiz-root-info err"; return; }
      document.getElementById("wizRootPrev").textContent = "📁 " + res.dir;
      info.textContent = res.created + " new project(s), " + res.loaded + " checklist(s) imported.";
    });
  });
  var _el_wizContinue = document.getElementById("wizContinue");

  if (_el_wizContinue) _el_wizContinue.addEventListener("click", finishWizard);
  var _el_wizClose = document.getElementById("wizClose");

  if (_el_wizClose) _el_wizClose.addEventListener("click", closeWizard);
  var _el_wizSkip = document.getElementById("wizSkip");

  if (_el_wizSkip) _el_wizSkip.addEventListener("click", function () {
    config.skipped = true;
    saveConfig();
    closeWizard();
    showToast("You can re-open the wizard anytime from the sidebar menu");
  });
  var _el_btnDbConnect = document.getElementById("btnDbConnect");

  if (_el_btnDbConnect) _el_btnDbConnect.addEventListener("click", function () {
    if (db.ready && db.rootHandle) {
      /* Deja konekte → re-ekri DB file la kounye a (sans debounce) */
      dbWrite().then(function (ok) {
        showToast(ok ? "💾 DB saved: " + db.folderName + "/" + DB_FILE : "DB save failed");
      });
      return;
    }
    dbConnect().then(function (ok) {
      if (ok && current) { renderAll(); }
    });
  });
  var _el_btnDbBackup = document.getElementById("btnDbBackup");

  if (_el_btnDbBackup) _el_btnDbBackup.addEventListener("click", function () { dbBackup(); });
  var _el_btnDbRestore = document.getElementById("btnDbRestore");

  if (_el_btnDbRestore) _el_btnDbRestore.addEventListener("click", function () {
    /* chwazi yon fichye .db backup → restore */
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".db,.json,application/json,application/octet-stream";
    inp.onchange = function () {
      if (inp.files && inp.files[0]) dbRestoreFromFile(inp.files[0]);
    };
    inp.click();
  });
  var _el_btnSettings = document.getElementById("btnSettings");

  if (_el_btnSettings) _el_btnSettings.addEventListener("click", openWizard);
  var _el_btnViewWizard = document.getElementById("btnViewWizard");

  if (_el_btnViewWizard) _el_btnViewWizard.addEventListener("click", openWizard);

  /* ── Mobile: drawer + bottom nav bar ────────────────────────────────── */
  var $drawerOverlay = document.getElementById("mobileSidebarOverlay");
  var $btnMenu = document.getElementById("btnMobileMenu");
  var $side = document.getElementById("mobileSidebar");
  function openDrawer() { if ($side) $side.classList.add("show"); if ($drawerOverlay) $drawerOverlay.classList.add("show"); document.body.style.overflow = "hidden"; }
  function closeDrawer() { if ($side) $side.classList.remove("show"); if ($drawerOverlay) $drawerOverlay.classList.remove("show"); document.body.style.overflow = ""; }
  if ($btnMenu) $btnMenu.addEventListener("click", openDrawer);
  if ($drawerOverlay) $drawerOverlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });
  /* lè yo chwazi yon pwojè nan drawer la → fèmen l */
  var _el_sideProjects = document.getElementById("sideProjects");

  if (_el_sideProjects) _el_sideProjects.addEventListener("click", function () { if (window.innerWidth <= 900) closeDrawer(); });
  /* tabs: Dashboard / Projects / Checklist / New / DB / Menu */
  var _el_tabDashboard = document.getElementById("tabDashboard");

  if (_el_tabDashboard) _el_tabDashboard.addEventListener("click", function () { setView("dashboard"); closeDrawer(); });
  var _el_tabProjects = document.getElementById("tabProjects");

  if (_el_tabProjects) _el_tabProjects.addEventListener("click", function () { showProjects(); closeDrawer(); });
  var _el_tabChecklist = document.getElementById("tabChecklist");

  if (_el_tabChecklist) _el_tabChecklist.addEventListener("click", function () { setView("checklist"); closeDrawer(); });
  var _el_tabNew = document.getElementById("tabNew");

  if (_el_tabNew) _el_tabNew.addEventListener("click", function () { openNameModal("new"); });
  var _el_tabDb = document.getElementById("tabDb");

  if (_el_tabDb) _el_tabDb.addEventListener("click", function () { document.getElementById("btnDbConnect").click(); });
  var _el_tabMenu = document.getElementById("tabMenu");

  if (_el_tabMenu) _el_tabMenu.addEventListener("click", openDrawer);
  /* Back to Projects button */
  var _el_btnBackProjects = document.getElementById("btnBackProjects");

  if (_el_btnBackProjects) _el_btnBackProjects.addEventListener("click", function () { backToProjects(); closeDrawer(); });
  /* New Project button on Projects page */
  var _el_btnNewProjectPage = document.getElementById("btnNewProjectPage");

  if (_el_btnNewProjectPage) _el_btnNewProjectPage.addEventListener("click", function () { openNameModal("new"); closeDrawer(); });
  /* ── Mobile sidebar nav buttons ─────────────────────────────────────── */
  var _el_btnViewDashboardMobile = document.getElementById("btnViewDashboardMobile");
  if (_el_btnViewDashboardMobile) _el_btnViewDashboardMobile.addEventListener("click", function () { setView("dashboard"); closeDrawer(); });
  var _el_btnViewProjectsMobile = document.getElementById("btnViewProjectsMobile");
  if (_el_btnViewProjectsMobile) _el_btnViewProjectsMobile.addEventListener("click", function () { showProjects(); closeDrawer(); });
  var _el_btnViewChecklistMobile = document.getElementById("btnViewChecklistMobile");
  if (_el_btnViewChecklistMobile) _el_btnViewChecklistMobile.addEventListener("click", function () { setView("checklist"); closeDrawer(); });
  var _el_btnViewTasksMobile = document.getElementById("btnViewTasksMobile");
  if (_el_btnViewTasksMobile) _el_btnViewTasksMobile.addEventListener("click", function () { setView("tasks"); closeDrawer(); });
  var _el_btnViewActivityMobile = document.getElementById("btnViewActivityMobile");
  if (_el_btnViewActivityMobile) _el_btnViewActivityMobile.addEventListener("click", function () { setView("activity"); closeDrawer(); });
  var _el_btnViewWizardMobile = document.getElementById("btnViewWizardMobile");
  if (_el_btnViewWizardMobile) _el_btnViewWizardMobile.addEventListener("click", function () { openWizard(); closeDrawer(); });
  var _el_btnSettingsPageMobile = document.getElementById("btnSettingsPageMobile");
  if (_el_btnSettingsPageMobile) _el_btnSettingsPageMobile.addEventListener("click", function () { setView("settings"); closeDrawer(); });
  /* reflète tab aktif nan bottom nav la lè view chanje */
  var $tabs = document.querySelectorAll("#tabBar button[data-view]");
  function renderTabs() {
    var activeView = currentView === "dashboard" ? "dashboard" : currentView === "projects" ? "projects" : "checklist";
    $tabs.forEach(function (t) { t.classList.toggle("on", t.dataset.view === activeView); });
    var active = document.getElementById("tabBar").querySelector("button.on");
    if (active && active.id !== "tabChecklist" && active.id !== "tabDashboard" && active.id !== "tabProjects") {
      document.getElementById("tabChecklist").classList.add("on");
    }
  }
  var _origSetView = setView;
  setView = function (v) { _origSetView(v); renderTabs(); };
  renderTabs();

  $wizCompany.addEventListener("input", function () {
    document.getElementById("wizBrandPrev").textContent = $wizCompany.value.trim() || "JRiSpace";
  });
  $wizCompany.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("wizFinish").click(); }
  });

  /* ── Multi-tab sync: si yon lòt tab sove, re-chaje done yo ──────────── */
  window.addEventListener("storage", function (e) {
    if (!e.key) return;
    if (e.key === REGISTRY_KEY || e.key.indexOf("jrispace.checklist.v2.") === 0) {
      var was = current ? current.key : null;
      registry = loadRegistry();
      if (e.key === REGISTRY_KEY) renderSidebar();
      if (was && findProject(was)) {
        var p = findProject(was);
        p.data = loadProjectData(p.key, p.name);
        current = p;
        renderAll();
      } else if (registry.projects.length) {
        switchTo(registry.projects[0].key);
      }
      showToast("🔄 Updated from another tab");
    }
  });

  /* ── i18n: EN / HT / FR — strings UI kle yo ─────────────────────────── */
  var L = {
    en: {
      navDashboard: "📊 Dashboard", navChecklist: "✓ Checklist", navWizard: "🚀 Setup wizard",
      rootLabel: "📁 Root", btnScan: "Scan folder", projectsLabel: "🚀 Projects", btnNew: "+ New",
      btnRename: "Rename", btnDelete: "Delete", btnDup: "⧉ Duplicate", btnBackup: "🗄 Backup",
      btnRestore: "♻ Restore", btnBrand: "⚙ Brand", btnThemeDark: "🌙 Dark", btnThemeLight: "☀️ Light",
      btnExport: "Export", btnImport: "Import", btnVerify: "⟳ Verify", btnAddPhase: "+ Phase", btnReset: "Reset",
      searchPh: "🔍 Search tasks… (all projects)", counts: "tasks", lang: "🌐 EN",
      stOpen: "Open", stProgress: "In progress", stDone: "Done", stBlocked: "Blocked",
      prHigh: "🔴 High", prMed: "🟠 Medium", prLow: "🟢 Low", prNone: "None"
    },
    ht: {
      navDashboard: "📊 Tablo", navChecklist: "✓ Lis tach", navWizard: "🚀 Asistan konfigirasyon",
      rootLabel: "📁 Rasin", btnScan: "Analize katab", projectsLabel: "🚀 Pwojè", btnNew: "+ Nouvo",
      btnRename: "Chanje non", btnDelete: "Efase", btnDup: "⧉ Kopi", btnBackup: "🗄 Sekirite",
      btnRestore: "♻ Retabli", btnBrand: "⚙ Mak", btnThemeDark: "🌙 Fonse", btnThemeLight: "☀️ Klere",
      btnExport: "Ekspòte", btnImport: "Enpòte", btnVerify: "⟳ Verifye", btnAddPhase: "+ Faz", btnReset: "Reyajiste",
      searchPh: "🔍 Chèche tach… (tout pwojè)", counts: "tach", lang: "🌐 HT",
      stOpen: "Louvri", stProgress: "Nan pwogrè", stDone: "Fèt", stBlocked: "Bloke",
      prHigh: "🔴 Wo", prMed: "🟠 Mwayen", prLow: "🟢 Ba", prNone: "Okenn"
    },
    fr: {
      navDashboard: "📊 Tableau de bord", navChecklist: "✓ Liste", navWizard: "🚀 Assistant",
      rootLabel: "📁 Racine", btnScan: "Analyser dossier", projectsLabel: "🚀 Projets", btnNew: "+ Nouveau",
      btnRename: "Renommer", btnDelete: "Supprimer", btnDup: "⧉ Dupliquer", btnBackup: "🗄 Sauvegarde",
      btnRestore: "♻ Restaurer", btnBrand: "⚙ Marque", btnThemeDark: "🌙 Sombre", btnThemeLight: "☀️ Clair",
      btnExport: "Exporter", btnImport: "Importer", btnVerify: "⟳ Vérifier", btnAddPhase: "+ Phase", btnReset: "Réinitialiser",
      searchPh: "🔍 Rechercher tâches… (tous projets)", counts: "tâches", lang: "🌐 FR",
      stOpen: "Ouvert", stProgress: "En cours", stDone: "Terminé", stBlocked: "Bloqué",
      prHigh: "🔴 Haute", prMed: "🟠 Moyenne", prLow: "🟢 Basse", prNone: "Aucune"
    }
  };
  function t(key) {
    var l = L[config.lang] || L.en;
    return l[key] != null ? l[key] : L.en[key];
  }
  function applyLang() {
    var lang = config.lang || "en";
    document.documentElement.lang = lang === "ht" ? "ht" : lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    var s = document.getElementById("taskSearch");
    if (s) s.placeholder = t("searchPh");
    var bl = document.getElementById("btnLang");
    if (bl) bl.textContent = t("lang");
    var bt = document.getElementById("btnTheme");
    if (bt) bt.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? t("btnThemeLight") : t("btnThemeDark");
  }
  var LANGS = ["en", "ht", "fr"];
  var $btnLang = document.getElementById("btnLang");
  if ($btnLang) {
    $btnLang.addEventListener("click", function () {
      var i = LANGS.indexOf(config.lang || "en");
      config.lang = LANGS[(i + 1) % LANGS.length];
      saveConfig();
      applyLang();
      showToast("Language: " + config.lang.toUpperCase());
    });
  }
  if (!config.lang) config.lang = "en";
  applyLang();

  /* ── Dark mode toggle ───────────────────────────────────────────────── */
  function applyTheme(theme) {
    var dark = theme === "dark" || (theme === "auto" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    var btn = document.getElementById("btnTheme");
    if (btn) btn.textContent = dark ? "☀️ Light" : "🌙 Dark";
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    config.theme = cur === "dark" ? "light" : "dark";
    saveConfig();
    applyTheme(config.theme);
  }
  var $btnTheme = document.getElementById("btnTheme");
  if ($btnTheme) $btnTheme.addEventListener("click", toggleTheme);
  if (!config.theme) config.theme = "auto";
  applyTheme(config.theme);

  /* ── Init ───────────────────────────────────────────────────────────── */
  migrateLegacyIfNeeded();
  saveRegistry();
  renderDbBadge();
  if (registry.projects.length) showProjects();
  else { current = null; renderAll(); } /* fresh install → totally clean */
  applyBrand();
  if (!config.launched && !config.skipped) openWizard();
  dbAutoReconnect().then(function (ok) {
    if (ok && current) renderAll(); /* done yo chaje depi disk — re-render */
  });


  /* ── Profile dropdown toggle ──────────────────────────────────── */
  var $profileBtn = document.getElementById("btnProfile");
  var $profileDropdown = document.getElementById("profileDropdown");
  var $profileClose = document.getElementById("btnProfileClose");
  
  if ($profileBtn && $profileDropdown) {
    $profileBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      $profileDropdown.hidden = !$profileDropdown.hidden;
    });
  }
  if ($profileClose) {
    $profileClose.addEventListener("click", function () {
      $profileDropdown.hidden = true;
    });
  }
  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if ($profileDropdown && !$profileDropdown.contains(e.target) && e.target !== $profileBtn) {
      $profileDropdown.hidden = true;
    }
  });

  /* ── Theme toggle (header button) ──────────────────────────────── */
  var $themeToggle = document.getElementById("btnThemeToggle");
  if ($themeToggle) {
    $themeToggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") || "dark";
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      $themeToggle.textContent = next === "dark" ? "🌙" : "☀️";
      localStorage.setItem("lpm.theme", next);
    });
  }

  /* ── Profile menu: Setup wizard ────────────────────────────────── */
  var $btnSetupWizard = document.getElementById("btnSetupWizard");
  if ($btnSetupWizard) {
    $btnSetupWizard.addEventListener("click", function () {
      $profileDropdown.hidden = true;
      openWizard();
    });
  }

  /* ── Profile menu: Settings page ───────────────────────────────── */
  var $btnSettings = document.getElementById("btnSettings");
  if ($btnSettings) {
    $btnSettings.addEventListener("click", function () {
      $profileDropdown.hidden = true;
      setView("settings");
    });
  }

  /* ── Settings page: Back button ────────────────────────────────── */
  var $btnBackFromSettings = document.getElementById("btnBackFromSettings");
  if ($btnBackFromSettings) {
    $btnBackFromSettings.addEventListener("click", function () {
      setView("dashboard");
    });
  }

  /* ── Settings page: Theme toggle ───────────────────────────────── */
  var $btnSettingTheme = document.getElementById("btnSettingTheme");
  if ($btnSettingTheme) {
    $btnSettingTheme.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") || "dark";
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      $btnSettingTheme.textContent = next === "dark" ? "🌙" : "☀️";
      if ($themeToggle) $themeToggle.textContent = next === "dark" ? "🌙" : "☀️";
      localStorage.setItem("lpm.theme", next);
    });
  }

  /* ── Settings page: Language selector ──────────────────────────── */
  var $btnSettingLang = document.getElementById("btnSettingLang");
  if ($btnSettingLang) {
    $btnSettingLang.addEventListener("change", function () {
      setLang(this.value);
      var $btnLang = document.getElementById("btnLang");
      if ($btnLang) $btnLang.textContent = this.value.toUpperCase();
    });
  }

  /* ── Settings page: Database buttons ───────────────────────────── */
  var $btnSettingDbConnect = document.getElementById("btnSettingDbConnect");
  if ($btnSettingDbConnect) {
    $btnSettingDbConnect.addEventListener("click", function () {
      document.getElementById("btnDbConnect").click();
    });
  }

  var $btnSettingBackup = document.getElementById("btnSettingBackup");
  if ($btnSettingBackup) {
    $btnSettingBackup.addEventListener("click", function () {
      dbBackup();
    });
  }

  var $btnSettingRestore = document.getElementById("btnSettingRestore");
  if ($btnSettingRestore) {
    $btnSettingRestore.addEventListener("click", function () {
      document.getElementById("btnDbRestore").click();
    });
  }

  /* ── Settings page: Project buttons ────────────────────────────── */
  var $btnSettingScan = document.getElementById("btnSettingScan");
  if ($btnSettingScan) {
    $btnSettingScan.addEventListener("click", function () {
      runScan();
    });
  }

  var $btnSettingNew = document.getElementById("btnSettingNew");
  if ($btnSettingNew) {
    $btnSettingNew.addEventListener("click", function () {
      openNameModal("new");
    });
  }

  /* ── Settings page: Data management ────────────────────────────── */
  var $btnSettingExport = document.getElementById("btnSettingExport");
  if ($btnSettingExport) {
    $btnSettingExport.addEventListener("click", function () {
      exportData();
    });
  }

  var $btnSettingImport = document.getElementById("btnSettingImport");
  if ($btnSettingImport) {
    $btnSettingImport.addEventListener("click", function () {
      importData();
    });
  }

  var $btnSettingClear = document.getElementById("btnSettingClear");
  if ($btnSettingClear) {
    $btnSettingClear.addEventListener("click", function () {
      if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
      }
    });
  }


  /* ── Export data as JSON ────────────────────────────────────────── */
  function exportData() {
    var data = {
      registry: registry,
      projects: {}
    };
    registry.projects.forEach(function (p) {
      data.projects[p.key] = loadProjectData(p.key, p.name);
    });
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "lpm-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data exported successfully");
  }

  /* ── Import data from JSON ──────────────────────────────────────── */
  function importData() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (data.registry) {
            registry = data.registry;
            saveRegistry();
          }
          if (data.projects) {
            Object.keys(data.projects).forEach(function (key) {
              localStorage.setItem("lpm.data." + key, JSON.stringify(data.projects[key]));
            });
          }
          showToast("Data imported successfully");
          renderAll();
        } catch (err) {
          showToast("Import failed: " + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /* ── PWA: enstale service worker a (https sèlman — file:// pa sipòte) ─ */
  if ("serviceWorker" in navigator && /^https:/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
