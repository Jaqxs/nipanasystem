"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import api from "../lib/api";
import { useCurrency } from "../lib/currency-context";
import { fmtWeight } from "../lib/mockData";

type Tab = "customers" | "suppliers";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  type: "customer" | "supplier";
  status: "active" | "inactive";
  totalValue: number;
  outstanding: number;
  notes: string;
  joined: string;
  lastTx: string;
}

export default function ContactsPage() {
  const [tab, setTab] = useState<Tab>("customers");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [detail, setDetail] = useState<Contact | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { format } = useCurrency();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/contacts");
      setAllContacts(data);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload: any) => {
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/contacts/${editing.id}`, payload);
      } else {
        await api.post("/contacts", { ...payload, type: tab === "customers" ? "customer" : "supplier" });
      }
      setCreating(false);
      setEditing(null);
      fetchContacts();
    } catch (err) {
      alert("Failed to save contact. " + (err as any).response?.data?.message || "");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await api.delete(`/contacts/${id}`);
      fetchContacts();
    } catch (err) {
      alert("Failed to delete contact. Only admins can delete.");
    }
  };

  const toggleStatus = async (contact: Contact) => {
    try {
      await api.put(`/contacts/${contact.id}`, { status: contact.status === "active" ? "inactive" : "active" });
      fetchContacts();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const customers = allContacts
    .filter((c) => c.type === "customer")
    .filter((c) => statusFilter === "All" || c.status === statusFilter.toLowerCase())
    .filter((c) => !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())));

  const suppliers = allContacts
    .filter((c) => c.type === "supplier")
    .filter((c) => statusFilter === "All" || c.status === statusFilter.toLowerCase())
    .filter((c) => !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())));

  const totalReceivable = allContacts.filter(c => c.type === "customer").reduce((a, b) => a + Number(b.outstanding), 0);
  const totalPayable = allContacts.filter(c => c.type === "supplier").reduce((a, b) => a + Number(b.outstanding), 0);
  const totalCustomerSpend = allContacts.filter(c => c.type === "customer").reduce((a, b) => a + Number(b.totalValue), 0);
  const totalSupplied_g = allContacts.filter(c => c.type === "supplier").reduce((a, b) => a + Number(b.totalValue), 0);

  const filteredCount = tab === "customers" ? customers.length : suppliers.length;
  const resourceLabel = tab === "customers" ? "customers" : "suppliers";

  const numCust = allContacts.filter(c => c.type === "customer").length;
  const numSupp = allContacts.filter(c => c.type === "supplier").length;
  const activeCust = allContacts.filter(c => c.type === "customer" && c.status === "active").length;
  const activeSupp = allContacts.filter(c => c.type === "supplier" && c.status === "active").length;

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Customers and suppliers — assigned a unique ID for every transaction."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-user-add-line" /> Register {tab === "customers" ? "buyer" : "seller"}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Customers" value={numCust.toString()} hint={`${activeCust} active`} icon="ri-user-3-line" />
        <Stat label="Suppliers" value={numSupp.toString()} hint={`${activeSupp} active`} icon="ri-truck-line" />
        <Stat label="Customer receivable" value={format(totalReceivable)} hint="outstanding balance" icon="ri-arrow-right-down-line" tone="rose" />
        <Stat label="Supplier payable" value={format(totalPayable)} hint="awaiting payment" icon="ri-arrow-right-up-line" tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="surface-flat p-1 inline-flex gap-1">
          <button
            onClick={() => setTab("customers")}
            className={`px-4 py-1.5 rounded-md text-sm transition ${tab === "customers" ? "bg-gold-100 text-gold-700" : "text-ink-muted hover:bg-paper-100"}`}
          >
            <i className="ri-user-3-line mr-1.5" />
            Customers <span className="text-ink-faint ml-1">({numCust})</span>
          </button>
          <button
            onClick={() => setTab("suppliers")}
            className={`px-4 py-1.5 rounded-md text-sm transition ${tab === "suppliers" ? "bg-gold-100 text-gold-700" : "text-ink-muted hover:bg-paper-100"}`}
          >
            <i className="ri-truck-line mr-1.5" />
            Suppliers <span className="text-ink-faint ml-1">({numSupp})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            <option>All</option><option>Active</option><option>Inactive</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm surface-flat">
          <i className="ri-search-line text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${resourceLabel}...`}
            className="bg-transparent outline-none w-56 placeholder:text-ink-faint"
          />
        </div>
      </div>

      {loading ? (
        <div className="surface p-20 flex flex-col items-center justify-center text-ink-faint">
           <i className="ri-loader-4-line animate-spin text-3xl mb-2" />
           Loading contacts...
        </div>
      ) : tab === "customers" ? (
        <div className="surface">
          <table className="ledger">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Contact</th><th>Location</th>
                <th className="text-right">Total purchases</th>
                <th className="text-right">Outstanding</th>
                <th>Status</th><th>Joined</th><th />
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-ink-faint py-12">No customers match your filters.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => setDetail(c)}>
                  <td className="font-numeric text-ink">{c.id.slice(0, 8)}...</td>
                  <td className="text-ink font-medium">{c.name}</td>
                  <td className="text-ink-muted">
                    <div className="text-sm">{c.email}</div>
                    <div className="text-xs">{c.phone}</div>
                  </td>
                  <td className="text-ink-muted">{c.location}</td>
                  <td className="text-right font-numeric text-ink">{format(Number(c.totalValue))}</td>
                  <td className={`text-right font-numeric ${Number(c.outstanding) > 0 ? "text-rose-700" : "text-ink-faint"}`}>
                    {Number(c.outstanding) > 0 ? format(Number(c.outstanding)) : "—"}
                  </td>
                  <td><Badge tone={c.status === "active" ? "sage" : "terracotta"} dot>{c.status}</Badge></td>
                  <td className="text-ink-muted">{new Date(c.joined).toLocaleDateString()}</td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu actions={[
                      { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(c) },
                      { label: "Edit", icon: "ri-edit-line", onClick: () => setEditing(c) },
                      { label: "Send invoice", icon: "ri-file-paper-2-line", onClick: () => alert(`New invoice for ${c.name}`) },
                      { label: c.status === "active" ? "Deactivate" : "Activate", icon: c.status === "active" ? "ri-pause-line" : "ri-play-line", onClick: () => toggleStatus(c), divider: true },
                      { label: "Delete", icon: "ri-delete-bin-line", onClick: () => handleDelete(c.id), danger: true, divider: true },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="surface">
          <table className="ledger">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Contact</th><th>Location</th>
                <th className="text-right">Total supplied</th>
                <th className="text-right">Outstanding</th>
                <th>Status</th><th>Joined</th><th />
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-ink-faint py-12">No suppliers match your filters.</td></tr>
              ) : suppliers.map((s) => (
                <tr key={s.id} className="clickable" onClick={() => setDetail(s)}>
                  <td className="font-numeric text-ink">{s.id.slice(0, 8)}...</td>
                  <td className="text-ink font-medium">{s.name}</td>
                  <td className="text-ink-muted">
                    <div className="text-sm">{s.email}</div>
                    <div className="text-xs">{s.phone}</div>
                  </td>
                  <td className="text-ink-muted">{s.location}</td>
                  <td className="text-right font-numeric text-ink">{fmtWeight(Number(s.totalValue))}</td>
                  <td className={`text-right font-numeric ${Number(s.outstanding) > 0 ? "text-rose-700" : "text-ink-faint"}`}>
                    {Number(s.outstanding) > 0 ? format(Number(s.outstanding)) : "—"}
                  </td>
                  <td><Badge tone={s.status === "active" ? "sage" : "terracotta"} dot>{s.status}</Badge></td>
                  <td className="text-ink-muted">{new Date(s.joined).toLocaleDateString()}</td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu actions={[
                      { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(s) },
                      { label: "Edit", icon: "ri-edit-line", onClick: () => setEditing(s) },
                      { label: "Record purchase", icon: "ri-arrow-down-circle-line", onClick: () => alert(`New purchase from ${s.name}`) },
                      { label: s.status === "active" ? "Deactivate" : "Activate", icon: s.status === "active" ? "ri-pause-line" : "ri-play-line", onClick: () => toggleStatus(s), divider: true },
                      { label: "Delete", icon: "ri-delete-bin-line", onClick: () => handleDelete(s.id), danger: true, divider: true },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="surface-flat p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Customer lifetime value</div>
          <div className="font-numeric text-ink mt-0.5">{format(totalCustomerSpend)}</div>
        </div>
        <div className="surface-flat p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Total gold sourced</div>
          <div className="font-numeric text-ink mt-0.5">{fmtWeight(totalSupplied_g)}</div>
        </div>
        <div className="surface-flat p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Avg customer spend</div>
          <div className="font-numeric text-ink mt-0.5">{format(numCust ? totalCustomerSpend / numCust : 0)}</div>
        </div>
        <div className="surface-flat p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Avg supplier delivery</div>
          <div className="font-numeric text-ink mt-0.5">{fmtWeight(numSupp ? totalSupplied_g / numSupp : 0)}</div>
        </div>
      </div>

      <ContactDetailModal contact={detail} onClose={() => setDetail(null)} format={format} onEdit={(c) => { setDetail(null); setEditing(c); }} />

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} size="lg"
        eyebrow={editing ? (editing.type === "customer" ? "Edit customer" : "Edit supplier") : (tab === "customers" ? "New customer (buyer)" : "New supplier (seller)")}
        title={editing ? editing.name : `Register a ${tab === "customers" ? "buyer" : "seller"}`}
        footer={<>
          <button className="btn-secondary" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</button>
          <button className="btn-primary" form="contact-form" disabled={busy}>
            {busy ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-check-line" />}
            {editing ? "Save changes" : "Save & assign ID"}
          </button>
        </>}>
        <ContactForm kind={editing ? (editing.type === "customer" ? "customers" : "suppliers") : tab} initial={editing || undefined} onSave={handleSave} />
      </Modal>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource={resourceLabel} rowCount={filteredCount} />
    </div>
  );
}

function ContactDetailModal({
  contact, onClose, format, onEdit
}: { contact: Contact | null; onClose: () => void; format: (n: number) => string; onEdit: (c: Contact) => void }) {
  if (!contact) return null;
  const isCustomer = contact.type === "customer";
  const tint = isCustomer ? "#7a8c6b" : "#b8893d";

  return (
    <Modal open onClose={onClose} size="lg"
      eyebrow={isCustomer ? "Customer" : "Supplier"}
      title={contact.name}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-secondary" onClick={() => onEdit(contact)}><i className="ri-edit-line" />Edit</button>
        {isCustomer ? (
          <button className="btn-primary"><i className="ri-file-paper-2-line" />Create invoice</button>
        ) : (
          <button className="btn-primary"><i className="ri-arrow-down-circle-line" />Record purchase</button>
        )}
      </>}>
      <div className="surface-flat p-5 mb-5"
        style={{ background: `linear-gradient(180deg, ${tint}0d 0%, transparent 100%)`, borderColor: `${tint}33` }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${tint}1f`, color: tint }}>
            <i className={`${isCustomer ? "ri-user-3-line" : "ri-truck-line"} text-3xl`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-numeric text-sm text-ink-soft">{contact.id.slice(0,8)}...</span>
              <Badge tone={contact.status === "active" ? "sage" : "terracotta"} dot>{contact.status}</Badge>
            </div>
            <div className="text-base font-medium text-ink">{contact.name}</div>
            <div className="text-xs text-ink-muted mt-1">{contact.location}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              {isCustomer ? "Lifetime spend" : "Total supplied"}
            </div>
            <div className="font-numeric text-2xl text-ink leading-none mt-1">
              {isCustomer
                ? format(Number(contact.totalValue))
                : fmtWeight(Number(contact.totalValue))}
            </div>
            {(Number(contact.outstanding) > 0) && (
              <div className="text-[11px] text-rose-700 mt-1">{format(Number(contact.outstanding))} outstanding</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="Contact">
          <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
            <Row label="Email" value={contact.email} />
            <Row label="Phone" value={contact.phone} />
            <Row label="Location" value={contact.location} />
            <Row label="Joined" value={new Date(contact.joined).toLocaleDateString()} />
            <Row label="Status" value={<Badge tone={contact.status === "active" ? "sage" : "terracotta"} dot>{contact.status}</Badge>} />
          </dl>
        </Section>

        <Section title="Activity summary">
          <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
            <Row label={isCustomer ? "Total purchases" : "Gold supplied"} value={isCustomer ? format(Number(contact.totalValue)) : fmtWeight(Number(contact.totalValue))} mono />
            <Row label="Outstanding" value={format(Number(contact.outstanding))} mono valueClass={Number(contact.outstanding) > 0 ? "text-rose-700" : "text-ink-faint"} />
          </dl>
        </Section>
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Recent activity</div>
        <div className="surface-flat p-8 text-center text-ink-faint text-sm">
           No transactions recorded for this contact yet.
        </div>
      </div>
    </Modal>
  );
}

function ContactForm({ kind, initial, onSave }: { kind: Tab; initial?: Contact; onSave: (p: any) => void }) {
  const isCustomer = kind === "customers";
  const [formData, setFormData] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    location: initial?.location || "",
    status: initial?.status || "active",
    notes: initial?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form id="contact-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <Field label={`${isCustomer ? "Customer" : "Supplier"} ID`}>
        <input className="input" placeholder="Auto-generated" disabled defaultValue={initial?.id} />
      </Field>
      <Field label="Status">
        <select className="input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </Field>
      <Field label={isCustomer ? "Customer / business name" : "Supplier / cooperative name"} full>
        <input className="input" required placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
      </Field>
      <Field label="Email">
        <input className="input" type="email" placeholder="contact@example.tz" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
      </Field>
      <Field label="Phone">
        <input className="input" placeholder="+255 ..." value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
      </Field>
      <Field label="Location" full>
        <input className="input" placeholder="Region · City" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
      </Field>
      <Field label="Notes" full>
        <textarea rows={2} className="input" placeholder="Optional internal notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
      </Field>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, mono, valueClass }: { label: string; value: React.ReactNode; mono?: boolean; valueClass?: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-0.5">{label}</dt>
      <dd className={`text-ink ${mono ? "font-numeric" : ""} ${valueClass || ""}`}>{value}</dd>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function Stat({ label, value, hint, icon, tone = "ink" }: { label: string; value: string; hint: string; icon: string; tone?: "ink" | "rose" | "sage" }) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</div>
        <i className={`${icon} text-gold-600 text-base opacity-70`} />
      </div>
      <div className={`font-numeric text-[26px] leading-none ${tone === "rose" ? "text-rose-700" : tone === "sage" ? "text-sage-700" : "text-ink"}`}>{value}</div>
      <div className="text-xs text-ink-muted mt-2">{hint}</div>
    </div>
  );
}
