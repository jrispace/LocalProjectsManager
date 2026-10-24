// i18n translations for EN, HT, FR
import { EXTRA } from "./i18n-extra";

const translations: Record<string, Record<string, string>> = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.projects": "My Projects",
    "nav.checklist": "Checklist",
    "nav.tasks": "Tasks",
    "nav.activity": "Activity Log",
    "nav.settings": "Settings",
    "nav.wizard": "Setup Wizard",

    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.overview": "Here's an overview of your projects",
    "dashboard.totalProjects": "Total Projects",
    "dashboard.totalTasks": "Total Tasks",
    "dashboard.completed": "Completed",
    "dashboard.overdue": "Overdue",
    "dashboard.overallProgress": "Overall Progress",
    "dashboard.recentProjects": "Recent Projects",
    "dashboard.viewAll": "View All",
    "dashboard.noProjects": "No projects yet",
    "dashboard.createFirst": "Create your first project to get started",
    "dashboard.copyReport": "Copy report",
    "dashboard.reportCopied": "Report copied to clipboard",
    "dashboard.total": "Total",

    // Projects
    "projects.title": "My Projects",
    "projects.new": "+ New",
    "projects.rename": "Rename",
    "projects.duplicate": "Duplicate",
    "projects.delete": "Delete",
    "projects.noProjects": "No projects yet",
    "projects.createFirst": "Create your first project to get started",
    "projects.confirmDelete": "Delete this project?",
    "projects.none": "No project selected",
    "projects.goTo": "Go to Projects",
    "projects.notFound": "Project not found",
    "projects.notFoundDesc": "This project has no saved data in this browser.",
    "projects.removeBroken": "Remove from list",
    "projects.searchPlaceholder": "Search projects…",
    "projects.noResults": "No project matches your search",
    "projects.clearSearch": "Clear search",
    "projects.back": "← Back",

    // Checklist
    "checklist.title": "Checklist",
    "checklist.addItem": "Add checklist item...",
    "checklist.add": "Add",
    "checklist.filterByProject": "Filter by project:",
    "checklist.allProjects": "All Projects",
    "checklist.noItems": "No checklist items",
    "checklist.addItems": "Add items to keep track of what needs to be done",

    // Tasks
    "tasks.title": "Tasks",
    "tasks.search": "Search tasks...",
    "tasks.noTasks": "No tasks yet",
    "tasks.addFirst": "Add tasks to your projects to get started",
    "tasks.remaining": "Remaining",

    // Activity
    "activity.title": "Activity Log",
    "activity.noActivity": "No activity yet",
    "activity.startTracking": "Start tracking your project activity",

    // Settings
    "settings.title": "Settings",
    "settings.company": "Company Name",
    "settings.author": "Author",
    "settings.website": "Website",
    "settings.theme": "Theme",
    "settings.language": "Language",
    "settings.dark": "Dark",
    "settings.light": "Light",
    "settings.auto": "Auto",
    "settings.save": "Save Settings",

    // Wizard
    "wizard.welcome": "Welcome to LocalProjectsManager",
    "wizard.welcomeDesc": "A 100% local project manager — nothing leaves your computer.",
    "wizard.next": "Next",
    "wizard.back": "Back",
    "wizard.finish": "Finish",
    "wizard.skip": "Skip",
    "wizard.companyStep": "Name your workspace",
    "wizard.companyDesc": "Enter your company or team name. This will replace 'JRiSpace' everywhere.",
    "wizard.companyPlaceholder": "Company Name",
    "wizard.folderStep": "Connect your projects",
    "wizard.folderDesc": "Connect a folder to import your existing projects. Each subfolder becomes a project.",
    "wizard.root": "Root",
    "wizard.scanFolder": "Scan Folder",
    "wizard.continue": "Continue",
    "wizard.done": "You're all set!",
    "wizard.doneDesc": "Your workspace is ready. You can always re-open this wizard from the sidebar.",
    "wizard.close": "Close",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.undo": "Undo",
    "common.items": "items",
    "common.item": "item",
    "common.tasks": "tasks",
    "common.task": "task",
    "common.phases": "phases",
    "common.phase": "phase",
    "common.overdue": "Overdue",

    // Phase
    "phase.title": "Phases",
    "phase.add": "+ Phase",
    "phase.name": "Phase Name",
    "phase.description": "Description (optional)",
    "phase.addPhase": "Add Phase",
    "phase.deletePhase": "Delete phase?",
    "phase.noPhases": "No phases yet",
    "phase.addFirst": "Add your first phase to get started",
    "phase.noTasks": "No tasks in this phase",

    // Task
    "task.add": "Add task",
    "task.edit": "Edit Task",
    "task.create": "Create Task",
    "task.text": "Task text",
    "task.notes": "Notes (optional)",
    "task.dueDate": "Due date",
    "task.priority": "Priority",
    "task.status": "Status",
    "task.phase": "Phase",
    "task.subtasks": "Sub-tasks",
    "task.addSubtask": "Add sub-task...",
    "task.deleteConfirm": "Delete this task?",

    // Status
    "status.open": "Open",
    "status.inProgress": "In progress",
    "status.done": "Done",
    "status.blocked": "Blocked",

    // Priority
    "priority.none": "None",
    "priority.high": "High",
    "priority.medium": "Medium",
    "priority.low": "Low",

    // DB
    "db.connect": "Connect DB",
    "db.connected": "Connected",
    "db.backup": "Backup",
    "db.restore": "Restore",
    "db.backupSuccess": "Backup created",
    "db.restoreSuccess": "Database restored",
    "db.connectSuccess": "Database connected",

    // Export/Import
    "export.json": "Export",
    "import.json": "Import",
    "import.selectFile": "Select JSON file",
    "import.success": "Project imported",
    "export.success": "Project exported",

    // Verify
    "verify.profile": "Verify",
    "verify.syncing": "Syncing profile...",
    "verify.complete": "Profile synced",
    "verify.missing": "Missing tasks added",

    // Project Detail
    "detail.openChecklist": "Open in checklist",
    "detail.phases": "Phases",
    "detail.tasks": "Tasks",
    "detail.progress": "Progress",

    // System Health
    "health.title": "System Health",
    "health.status": "Status",
    "health.healthy": "Healthy",
    "health.warning": "Warning",
    "health.critical": "Critical",

    // Overdue
    "overdue.yes": "Overdue",
    "overdue.no": "On track",

    // Multi-tab
    "multitab.synced": "Updated from another tab",

    // Branding
    "brand.poweredBy": "Powered by",
  },

  ht: {
    // Navigation
    "nav.dashboard": "Tablo bòd",
    "nav.projects": "Pwojè mwen",
    "nav.checklist": "Tcheke lis",
    "nav.tasks": "Tach",
    "nav.activity": "Jounal aktivite",
    "nav.settings": "Paramèt",
    "nav.wizard": "Asistan Enstalasyon",

    // Dashboard
    "dashboard.welcome": "Byenvini ankò",
    "dashboard.overview": "Isit la se yon vue jeneral sou pwojè ou yo",
    "dashboard.totalProjects": "Total Pwojè",
    "dashboard.totalTasks": "Total Tach",
    "dashboard.completed": "Konplete",
    "dashboard.overdue": "An reta",
    "dashboard.overallProgress": "Pwogrè Jeneral",
    "dashboard.recentProjects": "Pwojè Resan",
    "dashboard.viewAll": "Gade Tout",
    "dashboard.noProjects": "Pa gen pwojè ankò",
    "dashboard.createFirst": "Kreye premye pwojè ou pou kòmanse",
    "dashboard.copyReport": "Kopi rapò",
    "dashboard.reportCopied": "Rapò kopye nan papye kenbe",
    "dashboard.total": "Total",

    // Projects
    "projects.title": "Pwojè mwen",
    "projects.new": "+ Nouvo",
    "projects.rename": "Chanje non",
    "projects.duplicate": "Douple",
    "projects.delete": "Efase",
    "projects.noProjects": "Pa gen pwojè ankò",
    "projects.createFirst": "Kreye premye pwojè ou pou kòmanse",
    "projects.confirmDelete": "Efase pwojè sa a?",
    "projects.none": "Pa gen pwojè chwazi",
    "projects.goTo": "Ale nan Pwojè",
    "projects.notFound": "Pwojè pa jwenn",
    "projects.notFoundDesc": "Pwojè sa a pa gen done ki anrejistre nan navigatè sa a.",
    "projects.removeBroken": "Retire nan lis la",
    "projects.searchPlaceholder": "Chèche pwojè…",
    "projects.noResults": "Pa gen pwojè ki matche rechèch la",
    "projects.clearSearch": "Efase rechèch",
    "projects.back": "← Retounen",

    // Checklist
    "checklist.title": "Tcheke lis",
    "checklist.addItem": "Ajoute item tcheke lis...",
    "checklist.add": "Ajoute",
    "checklist.filterByProject": "Filtre pa pwojè:",
    "checklist.allProjects": "Tout Pwojè",
    "checklist.noItems": "Pa gen item tcheke lis",
    "checklist.addItems": "Ajoute item pou suivan sa ki dwe fèt",

    // Tasks
    "tasks.title": "Tach",
    "tasks.search": "Chèche tach...",
    "tasks.noTasks": "Pa gen tach ankò",
    "tasks.addFirst": "Ajoute tach nan pwojè ou pou kòmanse",
    "tasks.remaining": "Rezte",

    // Activity
    "activity.title": "Jounal aktivite",
    "activity.noActivity": "Pa gen aktivite ankò",
    "activity.startTracking": "Kòmanse suiv aktivite pwojè ou",

    // Settings
    "settings.title": "Paramèt",
    "settings.company": "Non Konpayi",
    "settings.author": "Otorè",
    "settings.website": "Sit wèb",
    "settings.theme": "Tèm",
    "settings.language": "Lang",
    "settings.dark": "Fènwa",
    "settings.light": "Klè",
    "settings.auto": "Otomatik",
    "settings.save": "Sove Paramèt",

    // Wizard
    "wizard.welcome": "Byenvini nan LocalProjectsManager",
    "wizard.welcomeDesc": "Yon manage pwojè 199% lokal — anyen pa kite òdinatè ou.",
    "wizard.next": "Suivant",
    "wizard.back": "Retounen",
    "wizard.finish": "Fini",
    "wizard.skip": "Pase",
    "wizard.companyStep": "Non espas travay ou",
    "wizard.companyDesc": "Antre non konpayi ou oswa ekip ou. Sa a ap ranplase 'JRiSpace' tout kote.",
    "wizard.companyPlaceholder": "Non Konpayi",
    "wizard.folderStep": "Konekte pwojè ou yo",
    "wizard.folderDesc": "Konekte yon dosye pou enpòte pwojè egzistan ou yo. Chak sous-dosye vin yon pwojè.",
    "wizard.root": "Rasin",
    "wizard.scanFolder": "Skane Dosye",
    "wizard.continue": "Kontinye",
    "wizard.done": "Ou pare!",
    "wizard.doneDesc": "Espas travay ou pare. Ou ka toujou re-ouvè asistan sa a nan bar lateral la.",
    "wizard.close": "Fèmen",

    // Common
    "common.save": "Sove",
    "common.cancel": "Anile",
    "common.delete": "Efase",
    "common.edit": "Chanje",
    "common.close": "Fèmen",
    "common.confirm": "Konfime",
    "common.loading": "Chaje...",
    "common.error": "Erè",
    "common.success": "Siksè",
    "common.undo": "Anile",
    "common.items": "item",
    "common.item": "item",
    "common.tasks": "tach",
    "common.task": "tach",
    "common.phases": "fas",
    "common.phase": "fas",
    "common.overdue": "An reta",

    // Phase
    "phase.title": "Fas",
    "phase.add": "+ Fas",
    "phase.name": "Non Fas",
    "phase.description": "Deskripsyon (opsyonèl)",
    "phase.addPhase": "Ajoute Fas",
    "phase.deletePhase": "Efase fas?",
    "phase.noPhases": "Pa gen fas ankò",
    "phase.addFirst": "Ajoute premye fas ou pou kòmanse",
    "phase.noTasks": "Pa gen tach nan fas sa a",

    // Task
    "task.add": "Ajoute tach",
    "task.edit": "Chanje Tach",
    "task.create": "Kreye Tach",
    "task.text": "Teks tach",
    "task.notes": "Nòt (opsyonèl)",
    "task.dueDate": "Dat limit",
    "task.priority": "Pwiorite",
    "task.status": "Estati",
    "task.phase": "Fas",
    "task.subtasks": "Sòtach",
    "task.addSubtask": "Ajoute sòtach...",
    "task.deleteConfirm": "Efase tach sa a?",

    // Status
    "status.open": "Ouvert",
    "status.inProgress": "An pwogrè",
    "status.done": "Fini",
    "status.blocked": "Bloke",

    // Priority
    "priority.none": "Pa gen",
    "priority.high": "Wo",
    "priority.medium": "Mwayèn",
    "priority.low": "Ba",

    // DB
    "db.connect": "Konekte DB",
    "db.connected": "Konekte",
    "db.backup": "Backup",
    "db.restore": "Retabli",
    "db.backupSuccess": "Backup kreye",
    "db.restoreSuccess": "Database retabli",
    "db.connectSuccess": "Database konekte",

    // Export/Import
    "export.json": "Ekspòte",
    "import.json": "Enpòte",
    "import.selectFile": "Chwazi fichye JSON",
    "import.success": "Pwojè enpòte",
    "export.success": "Pwojè ekspòte",

    // Verify
    "verify.profile": "Verifye",
    "verify.syncing": "Ap senkronize pwofil...",
    "verify.complete": "Pwofil senkronize",
    "verify.missing": "Tach ki manke ajoute",

    // Project Detail
    "detail.openChecklist": "Ouvè nan tcheke lis",
    "detail.phases": "Fas",
    "detail.tasks": "Tach",
    "detail.progress": "Pwogrè",

    // System Health
    "health.title": "Sante Sistèm",
    "health.status": "Estati",
    "health.healthy": "An sante",
    "health.warning": "Avètisman",
    "health.critical": "Kritik",

    // Overdue
    "overdue.yes": "An reta",
    "overdue.no": "Sou track",

    // Multi-tab
    "multitab.synced": "Mise à jour depi lòt onglèt",

    // Branding
    "brand.poweredBy": "Pouvwa pa",
  },

  fr: {
    // Navigation
    "nav.dashboard": "Tableau de bord",
    "nav.projects": "Mes projets",
    "nav.checklist": "Liste de contrôle",
    "nav.tasks": "Tâches",
    "nav.activity": "Journal d'activité",
    "nav.settings": "Paramètres",
    "nav.wizard": "Assistant de configuration",

    // Dashboard
    "dashboard.welcome": "Bon retour",
    "dashboard.overview": "Voici un aperçu de vos projets",
    "dashboard.totalProjects": "Total Projets",
    "dashboard.totalTasks": "Total Tâches",
    "dashboard.completed": "Terminé",
    "dashboard.overdue": "En retard",
    "dashboard.overallProgress": "Progression globale",
    "dashboard.recentProjects": "Projets récents",
    "dashboard.viewAll": "Voir tout",
    "dashboard.noProjects": "Pas encore de projets",
    "dashboard.createFirst": "Créez votre premier projet pour commencer",
    "dashboard.copyReport": "Copier le rapport",
    "dashboard.reportCopied": "Rapport copié dans le presse-papiers",
    "dashboard.total": "Total",

    // Projects
    "projects.title": "Mes projets",
    "projects.new": "+ Nouveau",
    "projects.rename": "Renommer",
    "projects.duplicate": "Dupliquer",
    "projects.delete": "Supprimer",
    "projects.noProjects": "Pas encore de projets",
    "projects.createFirst": "Créez votre premier projet pour commencer",
    "projects.confirmDelete": "Supprimer ce projet ?",
    "projects.none": "Aucun projet sélectionné",
    "projects.goTo": "Aller aux projets",
    "projects.notFound": "Projet introuvable",
    "projects.notFoundDesc": "Ce projet n'a aucune donnée enregistrée dans ce navigateur.",
    "projects.removeBroken": "Retirer de la liste",
    "projects.searchPlaceholder": "Rechercher un projet…",
    "projects.noResults": "Aucun projet ne correspond à votre recherche",
    "projects.clearSearch": "Effacer la recherche",
    "projects.back": "← Retour",

    // Checklist
    "checklist.title": "Liste de contrôle",
    "checklist.addItem": "Ajouter un élément...",
    "checklist.add": "Ajouter",
    "checklist.filterByProject": "Filtrer par projet :",
    "checklist.allProjects": "Tous les projets",
    "checklist.noItems": "Aucun élément",
    "checklist.addItems": "Ajoutez des éléments pour suivre ce qui doit être fait",

    // Tasks
    "tasks.title": "Tâches",
    "tasks.search": "Rechercher des tâches...",
    "tasks.noTasks": "Pas encore de tâches",
    "tasks.addFirst": "Ajoutez des tâches à vos projets pour commencer",
    "tasks.remaining": "Restant",

    // Activity
    "activity.title": "Journal d'activité",
    "activity.noActivity": "Pas encore d'activité",
    "activity.startTracking": "Commencez à suivre l'activité de vos projets",

    // Settings
    "settings.title": "Paramètres",
    "settings.company": "Nom de l'entreprise",
    "settings.author": "Auteur",
    "settings.website": "Site web",
    "settings.theme": "Thème",
    "settings.language": "Langue",
    "settings.dark": "Sombre",
    "settings.light": "Clair",
    "settings.auto": "Auto",
    "settings.save": "Enregistrer",

    // Wizard
    "wizard.welcome": "Bienvenue dans LocalProjectsManager",
    "wizard.welcomeDesc": "Un gestionnaire de projets 100% local — rien ne quitte votre ordinateur.",
    "wizard.next": "Suivant",
    "wizard.back": "Retour",
    "wizard.finish": "Terminer",
    "wizard.skip": "Passer",
    "wizard.companyStep": "Nommez votre espace de travail",
    "wizard.companyDesc": "Entrez le nom de votre entreprise ou équipe. Cela remplacera 'JRiSpace' partout.",
    "wizard.companyPlaceholder": "Nom de l'entreprise",
    "wizard.folderStep": "Connectez vos projets",
    "wizard.folderDesc": "Connectez un dossier pour importer vos projets existants. Chaque sous-dossier devient un projet.",
    "wizard.root": "Racine",
    "wizard.scanFolder": "Scanner le dossier",
    "wizard.continue": "Continuer",
    "wizard.done": "Vous êtes prêt !",
    "wizard.doneDesc": "Votre espace de travail est prêt. Vous pouvez toujours rouvrir cet assistant depuis la barre latérale.",
    "wizard.close": "Fermer",

    // Common
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.close": "Fermer",
    "common.confirm": "Confirmer",
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.undo": "Annuler",
    "common.items": "éléments",
    "common.item": "élément",
    "common.tasks": "tâches",
    "common.task": "tâche",
    "common.phases": "phases",
    "common.phase": "phase",
    "common.overdue": "En retard",

    // Phase
    "phase.title": "Phases",
    "phase.add": "+ Phase",
    "phase.name": "Nom de la phase",
    "phase.description": "Description (optionnel)",
    "phase.addPhase": "Ajouter une phase",
    "phase.deletePhase": "Supprimer cette phase ?",
    "phase.noPhases": "Pas encore de phases",
    "phase.addFirst": "Ajoutez votre première phase pour commencer",
    "phase.noTasks": "Aucune tâche dans cette phase",

    // Task
    "task.add": "Ajouter une tâche",
    "task.edit": "Modifier la tâche",
    "task.create": "Créer la tâche",
    "task.text": "Texte de la tâche",
    "task.notes": "Notes (optionnel)",
    "task.dueDate": "Date d'échéance",
    "task.priority": "Priorité",
    "task.status": "Statut",
    "task.phase": "Phase",
    "task.subtasks": "Sous-tâches",
    "task.addSubtask": "Ajouter une sous-tâche...",
    "task.deleteConfirm": "Supprimer cette tâche ?",

    // Status
    "status.open": "Ouvert",
    "status.inProgress": "En cours",
    "status.done": "Terminé",
    "status.blocked": "Bloqué",

    // Priority
    "priority.none": "Aucune",
    "priority.high": "Haute",
    "priority.medium": "Moyenne",
    "priority.low": "Basse",

    // DB
    "db.connect": "Connecter la DB",
    "db.connected": "Connecté",
    "db.backup": "Sauvegarde",
    "db.restore": "Restaurer",
    "db.backupSuccess": "Sauvegarde créée",
    "db.restoreSuccess": "Base de données restaurée",
    "db.connectSuccess": "Base de données connectée",

    // Export/Import
    "export.json": "Exporter",
    "import.json": "Importer",
    "import.selectFile": "Sélectionner un fichier JSON",
    "import.success": "Projet importé",
    "export.success": "Projet exporté",

    // Verify
    "verify.profile": "Vérifier",
    "verify.syncing": "Synchronisation du profil...",
    "verify.complete": "Profil synchronisé",
    "verify.missing": "Tâches manquantes ajoutées",

    // Project Detail
    "detail.openChecklist": "Ouvrir dans la liste",
    "detail.phases": "Phases",
    "detail.tasks": "Tâches",
    "detail.progress": "Progression",

    // System Health
    "health.title": "Santé du système",
    "health.status": "Statut",
    "health.healthy": "Sain",
    "health.warning": "Avertissement",
    "health.critical": "Critique",

    // Overdue
    "overdue.yes": "En retard",
    "overdue.no": "Dans les temps",

    // Multi-tab
    "multitab.synced": "Mis à jour depuis un autre onglet",

    // Branding
    "brand.poweredBy": "Propulsé par",
  },
};

export type Lang = "en" | "ht" | "fr";

let currentLang: Lang = "en";

export function setLang(lang: Lang): void {
  currentLang = lang;
}

export function getLang(): Lang {
  return currentLang;
}

export function t(key: string): string {
  return translations[currentLang]?.[key] || EXTRA[currentLang]?.[key] || translations.en[key] || EXTRA.en[key] || key;
}

export function cycleLang(): Lang {
  const langs: Lang[] = ["en", "ht", "fr"];
  const idx = langs.indexOf(currentLang);
  const next = langs[(idx + 1) % langs.length];
  setLang(next);
  return next;
}

export function getLangLabel(lang: Lang): string {
  return lang.toUpperCase();
}
