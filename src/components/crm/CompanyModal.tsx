import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import { t } from "../../lib/i18n";
import { saveCompany } from "../../lib/crm";
import type { Company } from "../../lib/types";

interface Props {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CompanyModal({ open, company, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(company?.name || "");
    setDomain(company?.domain || "");
    setIndustry(company?.industry || "");
    setNotes(company?.notes || "");
  }, [open, company]);

  const submit = () => {
    if (!name.trim()) return;
    saveCompany({ id: company?.id, name, domain: domain || undefined, industry: industry || undefined, notes: notes || undefined });
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={company ? t("crm.editCompany") : t("crm.newCompany")}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={submit}>{t("common.save")}</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="form-row form-row-full">
          <label className="text-xs text-muted">{t("crm.name")}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.domain")}</label>
          <input className="input" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com" />
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.industry")}</label>
          <input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="SaaS" />
        </div>
        <div className="form-row form-row-full">
          <label className="text-xs text-muted">{t("common.notes")}</label>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
