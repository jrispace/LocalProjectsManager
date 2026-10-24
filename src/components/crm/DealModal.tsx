import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import { t } from "../../lib/i18n";
import { DEAL_STAGES, OPEN_STAGES, saveDeal } from "../../lib/crm";
import type { Company, Contact, Deal, DealStage, Person } from "../../lib/types";

interface Props {
  open: boolean;
  deal: Deal | null;
  companies: Company[];
  contacts: Contact[];
  people: Person[];
  projects: { key: string; name: string }[];
  defaultStage?: DealStage;
  onClose: () => void;
  onSaved: () => void;
}

export default function DealModal({ open, deal, companies, contacts, people, projects, defaultStage, onClose, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [stage, setStage] = useState<DealStage>("lead");
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [probability, setProbability] = useState("10");
  const [expectedClose, setExpectedClose] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(deal?.title || "");
    setValue(String(deal?.value ?? 0));
    setCurrency(deal?.currency || "USD");
    setStage(deal?.stage || defaultStage || "lead");
    setCompanyId(deal?.companyId || "");
    setContactId(deal?.contactId || "");
    setOwnerId(deal?.ownerId || "");
    setProbability(String(deal?.probability ?? 10));
    setExpectedClose(deal?.expectedClose || "");
    setProjectKey(deal?.projectKey || "");
    setNotes(deal?.notes || "");
  }, [open, deal, defaultStage]);

  const submit = () => {
    if (!title.trim()) return;
    saveDeal({
      id: deal?.id,
      title,
      value: Number(value) || 0,
      currency,
      stage,
      companyId: companyId || undefined,
      contactId: contactId || undefined,
      ownerId: ownerId || undefined,
      probability: Math.max(0, Math.min(100, Number(probability) || 0)),
      expectedClose: expectedClose || undefined,
      projectKey: projectKey || undefined,
      notes: notes || undefined,
    });
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={deal ? t("crm.editDeal") : t("crm.newDeal")}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={submit}>{t("common.save")}</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="form-row form-row-full">
          <label className="text-xs text-muted">{t("crm.dealTitle")}</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Website redesign — Acme" autoFocus />
        </div>

        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.value")}</label>
          <input className="input" type="number" min="0" step="50" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.currency")}</label>
          <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {["USD", "EUR", "BRL", "HTG", "CAD"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.stage")}</label>
          <select
            className="input"
            value={stage}
            onChange={(e) => {
              const next = e.target.value as DealStage;
              setStage(next);
              const meta = DEAL_STAGES.find((s) => s.id === next);
              if (meta) setProbability(String(meta.prob));
            }}
          >
            {DEAL_STAGES.map((s) => <option key={s.id} value={s.id}>{t(s.label)}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.probability")}</label>
          <input className="input" type="number" min="0" max="100" value={probability} onChange={(e) => setProbability(e.target.value)} />
        </div>

        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.company")}</label>
          <select className="input" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">—</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.contact")}</label>
          <select className="input" value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">—</option>
            {contacts
              .filter((c) => !companyId || !c.companyId || c.companyId === companyId)
              .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.owner")}</label>
          <select className="input" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">—</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.expectedClose")}</label>
          <input className="input" type="date" value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} />
        </div>

        <div className="form-row form-row-full">
          <label className="text-xs text-muted">{t("crm.linkedProject")}</label>
          <select className="input" value={projectKey} onChange={(e) => setProjectKey(e.target.value)}>
            <option value="">—</option>
            {projects.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
        </div>

        <div className="form-row form-row-full">
          <label className="text-xs text-muted">{t("common.notes")}</label>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {OPEN_STAGES.includes(stage) && (
          <p className="form-hint form-row-full">
            {t("crm.weightedHint")}: {currency} {Math.round(((Number(value) || 0) * (Number(probability) || 0)) / 100).toLocaleString()}
          </p>
        )}
      </div>
    </Modal>
  );
}
