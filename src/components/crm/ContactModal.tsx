import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import { t } from "../../lib/i18n";
import { saveContact } from "../../lib/crm";
import type { Company, Contact, Person } from "../../lib/types";

interface Props {
  open: boolean;
  contact: Contact | null;
  companies: Company[];
  people: Person[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ContactModal({ open, contact, companies, people, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(contact?.name || "");
    setCompanyId(contact?.companyId || "");
    setEmail(contact?.email || "");
    setPhone(contact?.phone || "");
    setRole(contact?.role || "");
    setOwnerId(contact?.ownerId || "");
    setTags((contact?.tags || []).join(", "));
    setNotes(contact?.notes || "");
  }, [open, contact]);

  const submit = () => {
    if (!name.trim()) return;
    saveContact({
      id: contact?.id,
      name,
      companyId: companyId || undefined,
      email: email || undefined,
      phone: phone || undefined,
      role: role || undefined,
      ownerId: ownerId || undefined,
      tags: tags.split(",").map((x) => x.trim()).filter(Boolean),
      notes: notes || undefined,
    });
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contact ? t("crm.editContact") : t("crm.newContact")}
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
          <label className="text-xs text-muted">{t("crm.company")}</label>
          <select className="input" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">—</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.role")}</label>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="CTO" />
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.phone")}</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.owner")}</label>
          <select className="input" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">—</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="text-xs text-muted">{t("crm.tags")}</label>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, retainer" />
        </div>
        <div className="form-row form-row-full">
          <label className="text-xs text-muted">{t("common.notes")}</label>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
