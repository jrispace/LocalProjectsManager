import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../lib/i18n";
import {
  DEAL_STAGES,
  OPEN_STAGES,
  crmStats,
  deleteCompany,
  deleteContact,
  deleteDeal,
  getCrm,
  initials,
  logCrmActivity,
  personName,
  setDealStage,
} from "../lib/crm";
import { getRegistry } from "../lib/storage";
import type { Company, Contact, CrmState, Deal, DealStage } from "../lib/types";
import DealModal from "../components/crm/DealModal";
import ContactModal from "../components/crm/ContactModal";
import CompanyModal from "../components/crm/CompanyModal";

type Tab = "pipeline" | "contacts" | "companies" | "activity";

const TABS: { id: Tab; key: string }[] = [
  { id: "pipeline", key: "crm.tab.pipeline" },
  { id: "contacts", key: "crm.tab.contacts" },
  { id: "companies", key: "crm.tab.companies" },
  { id: "activity", key: "crm.tab.activity" },
];

function money(value: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
  } catch {
    return `${currency} ${Math.round(value || 0).toLocaleString()}`;
  }
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export default function Crm() {
  const { refresh, refreshKey, showToast, askConfirm } = useApp();
  const [tab, setTab] = useState<Tab>("pipeline");
  const [state, setState] = useState<CrmState>(() => getCrm());
  const [query, setQuery] = useState("");

  const [dealModal, setDealModal] = useState<{ open: boolean; deal: Deal | null; stage?: DealStage }>({ open: false, deal: null });
  const [contactModal, setContactModal] = useState<{ open: boolean; contact: Contact | null }>({ open: false, contact: null });
  const [companyModal, setCompanyModal] = useState<{ open: boolean; company: Company | null }>({ open: false, company: null });
  const [note, setNote] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    setState(getCrm());
  }, [refreshKey]);

  useEffect(() => {
    setState(getCrm());
  }, [tab]);

  const projects = useMemo(() => getRegistry().projects || [], [refreshKey]);
  const stats = useMemo(() => crmStats(state.deals), [state.deals]);

  const companyById = useMemo(() => new Map(state.companies.map((c) => [c.id, c])), [state.companies]);
  const contactById = useMemo(() => new Map(state.contacts.map((c) => [c.id, c])), [state.contacts]);

  const afterSave = (message?: string) => {
    setState(getCrm());
    refresh();
    if (message) showToast(message, "success");
  };

  const dealsByStage = (stage: DealStage) => state.deals.filter((d) => d.stage === stage);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.contacts;
    return state.contacts.filter((c) => {
      const company = c.companyId ? companyById.get(c.companyId)?.name || "" : "";
      return `${c.name} ${c.email || ""} ${c.phone || ""} ${c.role || ""} ${c.tags.join(" ")} ${company}`.toLowerCase().includes(q);
    });
  }, [state.contacts, query, companyById]);

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.companies;
    return state.companies.filter((c) => `${c.name} ${c.domain || ""} ${c.industry || ""}`.toLowerCase().includes(q));
  }, [state.companies, query]);

  const openValueForCompany = (companyId: string) =>
    state.deals.filter((d) => d.companyId === companyId && OPEN_STAGES.includes(d.stage)).reduce((s, d) => s + d.value, 0);

  const openValueForContact = (contactId: string) =>
    state.deals.filter((d) => d.contactId === contactId && OPEN_STAGES.includes(d.stage)).reduce((s, d) => s + d.value, 0);

  const addNote = () => {
    if (!note.trim()) return;
    logCrmActivity("note", note.trim());
    setNote("");
    afterSave();
  };

  const onDropStage = (stage: DealStage) => {
    if (!dragId) return;
    setDealStage(dragId, stage);
    setDragId(null);
    afterSave();
  };

  return (
    <div className="page active animate-fade-in">
      <div className="page-head">
        <div>
          <h2 className="page-title">{t("crm.title")}</h2>
          <p className="page-sub">{t("crm.subtitle")}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setCompanyModal({ open: true, company: null })}>
            {t("crm.newCompany")}
          </button>
          <button className="btn btn-secondary" onClick={() => setContactModal({ open: true, contact: null })}>
            {t("crm.newContact")}
          </button>
          <button className="btn btn-primary" onClick={() => setDealModal({ open: true, deal: null })}>
            {t("crm.newDeal")}
          </button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <span className="kpi-label">{t("crm.kpi.pipeline")}</span>
          <span className="kpi-value">{money(stats.pipeline)}</span>
          <span className="kpi-hint">{stats.openCount} {t("crm.openDeals")}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">{t("crm.kpi.weighted")}</span>
          <span className="kpi-value accent">{money(stats.weighted)}</span>
          <span className="kpi-hint">{t("crm.weightedHint")}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">{t("crm.kpi.won")}</span>
          <span className="kpi-value emerald">{money(stats.wonValue)}</span>
          <span className="kpi-hint">{state.deals.filter((d) => d.stage === "won").length} {t("crm.wonDeals")}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">{t("crm.kpi.winRate")}</span>
          <span className="kpi-value">{stats.winRate}%</span>
          <span className="kpi-hint">{t("crm.lost")} {money(stats.lostValue)}</span>
        </div>
      </div>

      <div className="tabbar">
        {TABS.map((item) => (
          <button
            key={item.id}
            className={`tab ${tab === item.id ? "on" : ""}`}
            onClick={() => { setTab(item.id); setQuery(""); }}
          >
            {t(item.key)}
          </button>
        ))}
        {(tab === "contacts" || tab === "companies") && (
          <div className="tabbar-search">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "contacts" ? t("crm.searchContacts") : t("crm.searchCompanies")}
            />
          </div>
        )}
      </div>

      {tab === "pipeline" && (
        <div className="board">
          {DEAL_STAGES.map((stage) => {
            const deals = dealsByStage(stage.id);
            const total = deals.reduce((s, d) => s + d.value, 0);
            return (
              <div
                key={stage.id}
                className={`board-col ${dragId ? "droppable" : ""}`}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={() => onDropStage(stage.id)}
              >
                <div className="board-col-head">
                  <span className="board-dot" style={{ background: stage.accent }} />
                  <span className="board-col-title">{t(stage.label)}</span>
                  <span className="board-count">{deals.length}</span>
                  <span className="board-sum">{money(total)}</span>
                </div>

                <div className="board-col-body">
                  {deals.map((deal) => {
                    const company = deal.companyId ? companyById.get(deal.companyId) : undefined;
                    const contact = deal.contactId ? contactById.get(deal.contactId) : undefined;
                    const overdue = deal.expectedClose && new Date(deal.expectedClose).getTime() < Date.now() && OPEN_STAGES.includes(deal.stage);
                    return (
                      <div
                        key={deal.id}
                        className="deal-card"
                        draggable
                        onDragStart={() => setDragId(deal.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setDealModal({ open: true, deal })}
                      >
                        <div className="deal-card-top">
                          <span className="deal-title">{deal.title}</span>
                          <button
                            className="deal-menu"
                            title={t("common.delete")}
                            onClick={(e) => {
                              e.stopPropagation();
                              askConfirm(`${t("crm.confirmDeleteDeal")} “${deal.title}”?`, () => {
                                deleteDeal(deal.id);
                                afterSave(t("common.delete"));
                              });
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        {company && <div className="deal-company">{company.name}</div>}
                        <div className="deal-meta">
                          <span className="deal-value">{money(deal.value, deal.currency)}</span>
                          <span className="chip chip-soft">{deal.probability}%</span>
                          {deal.expectedClose && (
                            <span className={`chip ${overdue ? "chip-danger" : "chip-soft"}`}>{deal.expectedClose}</span>
                          )}
                        </div>
                        <div className="deal-foot">
                          {deal.ownerId ? (
                            <span className="avatar avatar-sm" title={personName(state.people, deal.ownerId)}>
                              {initials(personName(state.people, deal.ownerId))}
                            </span>
                          ) : <span />}
                          {contact && <span className="deal-contact">{contact.name}</span>}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    className="board-add"
                    onClick={() => setDealModal({ open: true, deal: null, stage: stage.id })}
                  >
                    + {t("crm.addDeal")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "contacts" && (
        <div className="card table-card">
          {filteredContacts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">{t("crm.empty.contacts")}</div>
              <button className="btn btn-primary" onClick={() => setContactModal({ open: true, contact: null })}>{t("crm.newContact")}</button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("crm.name")}</th>
                  <th>{t("crm.company")}</th>
                  <th>Email</th>
                  <th>{t("crm.phone")}</th>
                  <th>{t("crm.openValue")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => {
                  const company = contact.companyId ? companyById.get(contact.companyId) : undefined;
                  return (
                    <tr key={contact.id}>
                      <td>
                        <div className="cell-person">
                          <span className="avatar avatar-sm">{initials(contact.name)}</span>
                          <div>
                            <div className="cell-strong">{contact.name}</div>
                            {contact.role && <div className="cell-sub">{contact.role}</div>}
                          </div>
                        </div>
                        {contact.tags.length > 0 && (
                          <div className="chip-row">
                            {contact.tags.map((tag) => <span key={tag} className="chip chip-soft">{tag}</span>)}
                          </div>
                        )}
                      </td>
                      <td>{company?.name || <span className="text-muted">—</span>}</td>
                      <td>{contact.email || <span className="text-muted">—</span>}</td>
                      <td>{contact.phone || <span className="text-muted">—</span>}</td>
                      <td className="cell-strong">{money(openValueForContact(contact.id))}</td>
                      <td className="cell-actions">
                        <button className="btn-icon" title={t("common.edit")} onClick={() => setContactModal({ open: true, contact })}>✎</button>
                        <button
                          className="btn-icon"
                          title={t("common.delete")}
                          onClick={() => askConfirm(`${t("crm.confirmDeleteContact")} “${contact.name}”?`, () => {
                            deleteContact(contact.id);
                            afterSave(t("common.delete"));
                          })}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "companies" && (
        filteredCompanies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-title">{t("crm.empty.companies")}</div>
            <button className="btn btn-primary" onClick={() => setCompanyModal({ open: true, company: null })}>{t("crm.newCompany")}</button>
          </div>
        ) : (
          <div className="crm-grid">
            {filteredCompanies.map((company) => {
              const contacts = state.contacts.filter((c) => c.companyId === company.id);
              const deals = state.deals.filter((d) => d.companyId === company.id);
              return (
                <div key={company.id} className="crm-card">
                  <div className="crm-card-head">
                    <span className="avatar">{initials(company.name)}</span>
                    <div className="crm-card-title">
                      <div className="cell-strong">{company.name}</div>
                      <div className="cell-sub">{company.domain || company.industry || "—"}</div>
                    </div>
                    <button className="btn-icon" onClick={() => setCompanyModal({ open: true, company })}>✎</button>
                  </div>
                  <div className="crm-card-stats">
                    <div><span className="kpi-label">{t("crm.contactsCount")}</span><span className="cell-strong">{contacts.length}</span></div>
                    <div><span className="kpi-label">{t("crm.openValue")}</span><span className="cell-strong">{money(openValueForCompany(company.id))}</span></div>
                    <div><span className="kpi-label">{t("crm.dealsCount")}</span><span className="cell-strong">{deals.length}</span></div>
                  </div>
                  {contacts.length > 0 && (
                    <div className="chip-row">
                      {contacts.slice(0, 4).map((c) => <span key={c.id} className="chip chip-soft">{c.name}</span>)}
                    </div>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => askConfirm(`${t("crm.confirmDeleteCompany")} “${company.name}”?`, () => {
                      deleteCompany(company.id);
                      afterSave(t("common.delete"));
                    })}
                  >
                    {t("common.delete")}
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "activity" && (
        <div className="card">
          <div className="note-composer">
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
              placeholder={t("crm.notePlaceholder")}
            />
            <button className="btn btn-primary" onClick={addNote}>{t("crm.addNote")}</button>
          </div>
          {state.activities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🕓</div>
              <div className="empty-state-title">{t("crm.empty.activity")}</div>
            </div>
          ) : (
            <ul className="timeline">
              {state.activities.map((a) => {
                const deal = a.dealId ? state.deals.find((d) => d.id === a.dealId) : undefined;
                return (
                  <li key={a.id} className="timeline-item">
                    <span className={`timeline-dot ${a.type}`} />
                    <div className="timeline-body">
                      <div className="timeline-text">{a.text}</div>
                      <div className="timeline-meta">
                        {deal && <span className="chip chip-soft">{deal.title}</span>}
                        <span className="cell-sub">{relTime(a.at)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <DealModal
        open={dealModal.open}
        deal={dealModal.deal}
        defaultStage={dealModal.stage}
        companies={state.companies}
        contacts={state.contacts}
        people={state.people}
        projects={projects}
        onClose={() => setDealModal({ open: false, deal: null })}
        onSaved={() => afterSave(t("common.save"))}
      />
      <ContactModal
        open={contactModal.open}
        contact={contactModal.contact}
        companies={state.companies}
        people={state.people}
        onClose={() => setContactModal({ open: false, contact: null })}
        onSaved={() => afterSave(t("common.save"))}
      />
      <CompanyModal
        open={companyModal.open}
        company={companyModal.company}
        onClose={() => setCompanyModal({ open: false, company: null })}
        onSaved={() => afterSave(t("common.save"))}
      />
    </div>
  );
}
