// CRM data layer — companies, contacts, deals, activities, people.
// Local-first: localStorage is the source of truth, the connected disk
// database gets a mirrored copy so backups carry the CRM too.
import type {
  Company,
  Contact,
  CrmActivity,
  CrmActivityType,
  CrmState,
  Deal,
  DealStage,
  Person,
} from "./types";
import { getDiskCrm, isDiskConnected, saveDiskCrm } from "./diskdb";
import { t } from "./i18n";

const KEY = "lpm.crm.v1";

export const DEAL_STAGES: { id: DealStage; label: string; prob: number; accent: string }[] = [
  { id: "lead", label: "crm.stage.lead", prob: 10, accent: "#64748b" },
  { id: "qualified", label: "crm.stage.qualified", prob: 30, accent: "#38bdf8" },
  { id: "proposal", label: "crm.stage.proposal", prob: 50, accent: "#818cf8" },
  { id: "negotiation", label: "crm.stage.negotiation", prob: 70, accent: "#f59e0b" },
  { id: "won", label: "crm.stage.won", prob: 100, accent: "#10b981" },
  { id: "lost", label: "crm.stage.lost", prob: 0, accent: "#f87171" },
];

export const OPEN_STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation"];

export function emptyCrm(): CrmState {
  return { companies: [], contacts: [], deals: [], activities: [], people: [] };
}

export function crmId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normalize(raw: any): CrmState {
  const base = emptyCrm();
  if (!raw || typeof raw !== "object") return base;
  const arr = (x: any) => (Array.isArray(x) ? x.filter((v: any) => v && typeof v === "object") : []);
  return {
    companies: arr(raw.companies).map((c: any) => ({
      id: String(c.id || crmId("co")),
      name: String(c.name || "Untitled company"),
      domain: c.domain ? String(c.domain) : undefined,
      industry: c.industry ? String(c.industry) : undefined,
      notes: c.notes ? String(c.notes) : undefined,
      createdAt: String(c.createdAt || new Date().toISOString()),
    })),
    contacts: arr(raw.contacts).map((c: any) => ({
      id: String(c.id || crmId("ct")),
      name: String(c.name || "Unnamed contact"),
      companyId: c.companyId ? String(c.companyId) : undefined,
      email: c.email ? String(c.email) : undefined,
      phone: c.phone ? String(c.phone) : undefined,
      role: c.role ? String(c.role) : undefined,
      tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
      ownerId: c.ownerId ? String(c.ownerId) : undefined,
      notes: c.notes ? String(c.notes) : undefined,
      createdAt: String(c.createdAt || new Date().toISOString()),
      updatedAt: c.updatedAt ? String(c.updatedAt) : undefined,
    })),
    deals: arr(raw.deals).map((d: any) => ({
      id: String(d.id || crmId("dl")),
      title: String(d.title || "Untitled deal"),
      companyId: d.companyId ? String(d.companyId) : undefined,
      contactId: d.contactId ? String(d.contactId) : undefined,
      value: Number(d.value) || 0,
      currency: String(d.currency || "USD"),
      stage: (DEAL_STAGES.some((s) => s.id === d.stage) ? d.stage : "lead") as DealStage,
      probability: Number.isFinite(Number(d.probability)) ? Number(d.probability) : 10,
      expectedClose: d.expectedClose ? String(d.expectedClose) : undefined,
      ownerId: d.ownerId ? String(d.ownerId) : undefined,
      projectKey: d.projectKey ? String(d.projectKey) : undefined,
      notes: d.notes ? String(d.notes) : undefined,
      createdAt: String(d.createdAt || new Date().toISOString()),
      updatedAt: d.updatedAt ? String(d.updatedAt) : undefined,
      closedAt: d.closedAt ? String(d.closedAt) : undefined,
    })),
    activities: arr(raw.activities).map((a: any) => ({
      id: String(a.id || crmId("ac")),
      type: (["call", "email", "meeting", "note", "stage", "created"].includes(a.type) ? a.type : "note") as CrmActivityType,
      text: String(a.text || ""),
      dealId: a.dealId ? String(a.dealId) : undefined,
      contactId: a.contactId ? String(a.contactId) : undefined,
      companyId: a.companyId ? String(a.companyId) : undefined,
      at: String(a.at || new Date().toISOString()),
      by: a.by ? String(a.by) : undefined,
    })),
    people: arr(raw.people).map((p: any) => ({
      id: String(p.id || crmId("pp")),
      name: String(p.name || "Teammate"),
      email: p.email ? String(p.email) : undefined,
      color: p.color ? String(p.color) : undefined,
    })),
  };
}

export function getCrm(): CrmState {
  let local = emptyCrm();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) local = normalize(JSON.parse(raw));
  } catch {
    local = emptyCrm();
  }

  const disk = isDiskConnected() ? getDiskCrm() : null;
  if (!disk) return local;

  // Union by id so a restored disk backup never hides local work.
  const merged = normalize(disk);
  const pick = <T extends { id: string }>(a: T[], b: T[]) => {
    const map = new Map<string, T>();
    for (const item of b) map.set(item.id, item);
    for (const item of a) map.set(item.id, item);
    return [...map.values()];
  };
  return {
    companies: pick(local.companies, merged.companies),
    contacts: pick(local.contacts, merged.contacts),
    deals: pick(local.deals, merged.deals),
    activities: pick(local.activities, merged.activities).sort((x, y) => (x.at < y.at ? 1 : -1)),
    people: pick(local.people, merged.people),
  };
}

export function saveCrm(state: CrmState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error("CRM save failed:", e);
  }
  if (isDiskConnected()) saveDiskCrm(state);
}

// ── Companies ─────────────────────────────────────────────
export function saveCompany(input: Partial<Company> & { name: string }): Company {
  const state = getCrm();
  const now = new Date().toISOString();
  const existing = input.id ? state.companies.find((c) => c.id === input.id) : undefined;
  const company: Company = {
    id: existing?.id || crmId("co"),
    name: input.name.trim(),
    domain: input.domain?.trim() || existing?.domain,
    industry: input.industry?.trim() || existing?.industry,
    notes: input.notes ?? existing?.notes,
    createdAt: existing?.createdAt || now,
  };
  state.companies = existing ? state.companies.map((c) => (c.id === company.id ? company : c)) : [...state.companies, company];
  saveCrm(state);
  return company;
}

export function deleteCompany(id: string): void {
  const state = getCrm();
  state.companies = state.companies.filter((c) => c.id !== id);
  state.contacts = state.contacts.map((c) => (c.companyId === id ? { ...c, companyId: undefined } : c));
  state.deals = state.deals.map((d) => (d.companyId === id ? { ...d, companyId: undefined } : d));
  saveCrm(state);
}

// ── Contacts ──────────────────────────────────────────────
export function saveContact(input: Partial<Contact> & { name: string }): Contact {
  const state = getCrm();
  const now = new Date().toISOString();
  const existing = input.id ? state.contacts.find((c) => c.id === input.id) : undefined;
  const contact: Contact = {
    id: existing?.id || crmId("ct"),
    name: input.name.trim(),
    companyId: input.companyId || undefined,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    role: input.role?.trim() || undefined,
    tags: input.tags ?? existing?.tags ?? [],
    ownerId: input.ownerId || undefined,
    notes: input.notes ?? existing?.notes,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  state.contacts = existing ? state.contacts.map((c) => (c.id === contact.id ? contact : c)) : [...state.contacts, contact];
  saveCrm(state);
  return contact;
}

export function deleteContact(id: string): void {
  const state = getCrm();
  state.contacts = state.contacts.filter((c) => c.id !== id);
  state.deals = state.deals.map((d) => (d.contactId === id ? { ...d, contactId: undefined } : d));
  saveCrm(state);
}

// ── Deals ─────────────────────────────────────────────────
export function saveDeal(input: Partial<Deal> & { title: string }): Deal {
  const state = getCrm();
  const now = new Date().toISOString();
  const existing = input.id ? state.deals.find((d) => d.id === input.id) : undefined;
  const stage = (input.stage || existing?.stage || "lead") as DealStage;
  const stageMeta = DEAL_STAGES.find((s) => s.id === stage);
  const deal: Deal = {
    id: existing?.id || crmId("dl"),
    title: input.title.trim(),
    companyId: input.companyId || undefined,
    contactId: input.contactId || undefined,
    value: Number(input.value ?? existing?.value ?? 0) || 0,
    currency: input.currency || existing?.currency || "USD",
    stage,
    probability: Number(input.probability ?? existing?.probability ?? stageMeta?.prob ?? 10),
    expectedClose: input.expectedClose || undefined,
    ownerId: input.ownerId || undefined,
    projectKey: input.projectKey || undefined,
    notes: input.notes ?? existing?.notes,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    closedAt: stage === "won" || stage === "lost" ? existing?.closedAt || now : undefined,
  };
  state.deals = existing ? state.deals.map((d) => (d.id === deal.id ? deal : d)) : [...state.deals, deal];
  saveCrm(state);
  if (!existing) logCrmActivity("created", `Deal created: ${deal.title}`, { dealId: deal.id, companyId: deal.companyId });
  return deal;
}

export function setDealStage(id: string, stage: DealStage): Deal | null {
  const state = getCrm();
  const deal = state.deals.find((d) => d.id === id);
  if (!deal) return null;
  const meta = DEAL_STAGES.find((s) => s.id === stage);
  const updated: Deal = {
    ...deal,
    stage,
    probability: meta?.prob ?? deal.probability,
    updatedAt: new Date().toISOString(),
    closedAt: stage === "won" || stage === "lost" ? new Date().toISOString() : undefined,
  };
  state.deals = state.deals.map((d) => (d.id === id ? updated : d));
  saveCrm(state);
  const label = meta ? t(meta.label) : stage;
  logCrmActivity("stage", `${deal.title} → ${label}`, { dealId: deal.id, companyId: deal.companyId });
  return updated;
}

export function deleteDeal(id: string): void {
  const state = getCrm();
  state.deals = state.deals.filter((d) => d.id !== id);
  saveCrm(state);
}

// ── People ────────────────────────────────────────────────
const AVATAR_COLORS = ["#06b6d4", "#818cf8", "#f472b6", "#f59e0b", "#10b981", "#38bdf8", "#a78bfa"];

export function savePerson(input: Partial<Person> & { name: string }): Person {
  const state = getCrm();
  const existing = input.id ? state.people.find((p) => p.id === input.id) : undefined;
  const person: Person = {
    id: existing?.id || crmId("pp"),
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    color: input.color || existing?.color || AVATAR_COLORS[state.people.length % AVATAR_COLORS.length],
  };
  state.people = existing ? state.people.map((p) => (p.id === person.id ? person : p)) : [...state.people, person];
  saveCrm(state);
  return person;
}

export function deletePerson(id: string): void {
  const state = getCrm();
  state.people = state.people.filter((p) => p.id !== id);
  saveCrm(state);
}

// ── Activity ──────────────────────────────────────────────
export function logCrmActivity(
  type: CrmActivityType,
  text: string,
  refs: { dealId?: string; contactId?: string; companyId?: string; by?: string } = {}
): void {
  const state = getCrm();
  state.activities.unshift({
    id: crmId("ac"),
    type,
    text,
    at: new Date().toISOString(),
    by: refs.by,
    dealId: refs.dealId,
    contactId: refs.contactId,
    companyId: refs.companyId,
  });
  if (state.activities.length > 300) state.activities.length = 300;
  saveCrm(state);
}

// ── Derived numbers ───────────────────────────────────────
export interface CrmStats {
  pipeline: number;
  weighted: number;
  openCount: number;
  wonValue: number;
  lostValue: number;
  winRate: number;
}

export function crmStats(deals: Deal[]): CrmStats {
  const open = deals.filter((d) => OPEN_STAGES.includes(d.stage));
  const won = deals.filter((d) => d.stage === "won");
  const lost = deals.filter((d) => d.stage === "lost");
  const pipeline = open.reduce((s, d) => s + d.value, 0);
  const weighted = open.reduce((s, d) => s + (d.value * d.probability) / 100, 0);
  const wonValue = won.reduce((s, d) => s + d.value, 0);
  const lostValue = lost.reduce((s, d) => s + d.value, 0);
  const closed = won.length + lost.length;
  return {
    pipeline,
    weighted,
    openCount: open.length,
    wonValue,
    lostValue,
    winRate: closed ? Math.round((won.length / closed) * 100) : 0,
  };
}

export function personName(people: Person[], id?: string): string {
  if (!id) return "";
  return people.find((p) => p.id === id)?.name || "";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}
