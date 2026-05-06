"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { TransactionDetailModal } from "../components/TransactionDetailModal";
import api from "../lib/api";
import { useCurrency } from "../lib/currency-context";
import { useDateRange } from "../lib/date-range-context";

const TYPES = ["All", "Gold Sale", "Gold Purchase", "Op. Expense", "Processing", "Logistics", "Cash Inflow", "Cash Outflow"];
const STATUS = ["All", "Pending", "Confirmed", "Rejected"];

interface Tx {
  id: string;
  ref: string;
  date: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  notes: string;
  party: string;
  partyName?: string;
  partyContact?: { name: string };
  creator?: { name: string };
}

export default function TransactionsPage() {
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Tx | null>(null);
  const [creating, setCreating] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [confirming, setConfirming] = useState<{ tx: Tx; action: string } | null>(null);
  const [allTx, setAllTx] = useState<Tx[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { format } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "Gold Purchase",
    amount: "",
    currency: "USD",
    party: "", // ID
    partyName: "", // Text
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, contactRes] = await Promise.all([
        api.get("/transactions"),
        api.get("/contacts")
      ]);
      setAllTx(txRes.data);
      setContacts(contactRes.data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!confirming) return;
    setBusy(true);
    try {
      const { tx, action } = confirming;
      if (action === "delete") {
        await api.delete(`/transactions/${tx.id}`);
      } else {
        const newStatus = action === "approve" ? "confirmed" : "rejected";
        await api.put(`/transactions/${tx.id}`, { status: newStatus });
      }
      setConfirming(null);
      fetchData();
    } catch (err) {
      alert("Action failed. " + (err as any).response?.data?.message || "");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.amount || (!formData.party && !formData.partyName)) {
      alert("Please fill in amount and counterparty.");
      return;
    }
    setBusy(true);
    try {
      // Find if partyName matches an existing contact ID
      let finalParty = formData.party;
      let finalPartyName = formData.partyName;

      const matchedContact = contacts.find(c => c.name === formData.partyName);
      if (matchedContact) {
        finalParty = matchedContact.id;
        finalPartyName = ""; // Use linked contact instead
      }

      const payload = {
        ...formData,
        party: finalParty || null,
        partyName: finalPartyName,
        ref: "TX-" + Math.random().toString(36).toUpperCase().slice(2, 8),
        amount: Number(formData.amount)
      };
      await api.post("/transactions", payload);
      setCreating(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: "Gold Purchase",
        amount: "",
        currency: "USD",
        party: "",
        partyName: "",
        notes: ""
      });
      fetchData();
    } catch (err) {
      alert("Failed to create transaction. " + ((err as any).response?.data?.message || "Check your connection."));
    } finally {
      setBusy(false);
    }
  };

  const filtered = allTx
    .filter((r) => inRangeFromShortDate(r.date))
    .filter((r) => type === "All" || r.type === type)
    .filter((r) => status === "All" || r.status.toLowerCase() === status.toLowerCase())
    .filter((r) => !search ||
      r.ref.toLowerCase().includes(search.toLowerCase()) ||
      (r.partyContact?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.partyName || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Transactions"
        description={`All purchases, sales, and expenses · ${rangeLabel} · ${filtered.length} entries`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-add-line" /> New transaction
            </button>
          </>
        }
      />

      <div className="surface-flat p-3 flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <i className="ri-filter-3-line text-ink-muted" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Filters</span>
        </div>

        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {(type !== "All" || status !== "All" || search) && (
          <button
            onClick={() => { setType("All"); setStatus("All"); setSearch(""); }}
            className="text-xs text-gold-700 hover:underline"
          >
            Clear all
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm surface-flat">
          <i className="ri-search-line text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, party..."
            className="bg-transparent outline-none w-48 placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr>
              <th>Reference</th><th>Date</th><th>Type</th><th>Counterparty</th>
              <th className="text-right">Amount</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-20 text-ink-faint">Loading transactions...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-ink-faint py-12">No transactions match your filters.</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="clickable" onClick={() => setDetail(t)}>
                <td className="font-numeric text-ink">{t.ref}</td>
                <td className="text-ink-muted">{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.type}</td>
                <td className="text-ink-soft">{t.partyContact?.name || t.partyName || "N/A"}</td>
                <td className={`text-right font-numeric ${t.amount < 0 ? "text-rose-700" : "text-sage-700"}`}>
                  {t.amount < 0 ? "−" : "+"}{format(Math.abs(t.amount))}
                </td>
                <td><Badge tone={statusToTone(t.status)}>{t.status}</Badge></td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu actions={[
                    { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(t) },
                    ...(t.status === "pending" ? [
                      { label: "Approve", icon: "ri-check-line", onClick: () => setConfirming({ tx: t, action: "approve" }) },
                      { label: "Reject", icon: "ri-close-line", onClick: () => setConfirming({ tx: t, action: "reject" }), danger: true },
                    ] : []),
                    { label: "Delete", icon: "ri-delete-bin-line", onClick: () => setConfirming({ tx: t, action: "delete" }), danger: true, divider: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionDetailModal tx={detail as any} onClose={() => setDetail(null)} />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="transactions" rowCount={filtered.length} />

      <Modal open={!!confirming} onClose={() => setConfirming(null)}
        eyebrow="Confirm action" title={confirming ? `${confirming.action[0].toUpperCase() + confirming.action.slice(1)} ${confirming.tx.ref}?` : ""}
        footer={<>
          <button className="btn-secondary" onClick={() => setConfirming(null)}>Cancel</button>
          <button className={confirming?.action === "approve" ? "btn-primary" : "btn-secondary"}
            style={confirming?.action !== "approve" ? { background: "#a85944", color: "#fff", border: "none" } : undefined}
            onClick={handleAction} disabled={busy}>
            {busy ? <i className="ri-loader-4-line animate-spin" /> : (confirming?.action === "approve" ? "Approve" : confirming?.action === "reject" ? "Reject" : "Delete")}
          </button>
        </>}>
        <p className="text-sm text-ink-soft">
          {confirming?.action === "approve" && "Approving will lock this transaction and propagate it to inventory and cash flow."}
          {confirming?.action === "reject" && "The submitter will be notified. They can revise and resubmit."}
          {confirming?.action === "delete" && "This action cannot be undone. The audit log entry will remain."}
        </p>
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} size="lg"
        eyebrow="New transaction" title="Record a transaction"
        footer={<>
          <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={busy}>
            {busy ? <i className="ri-loader-4-line animate-spin mr-2" /> : <i className="ri-check-line mr-2" />}
            Submit for approval
          </button>
        </>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Date"><input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="input" /></Field>
          <Field label="Type">
            <select className="input" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
              {TYPES.slice(1).map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Amount">
            <div className="flex">
              <input type="number" className="input rounded-r-none" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              <select className="input rounded-l-none w-24" value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})}>
                <option>USD</option><option>TZS</option>
              </select>
            </div>
          </Field>
          <Field label="Counterparty">
            <div className="relative">
              <input 
                list="contact-list"
                className="input" 
                placeholder="Type name or select contact..."
                value={formData.partyName}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = contacts.find(c => c.name === val);
                  setFormData({
                    ...formData, 
                    partyName: val,
                    party: matched ? matched.id : ""
                  });
                }}
              />
              <datalist id="contact-list">
                {contacts.map(c => <option key={c.id} value={c.name}>{c.type}</option>)}
              </datalist>
            </div>
          </Field>
          <Field label="Reference number"><input className="input" placeholder="Auto-generated" disabled /></Field>
          <Field label="Description" full>
            <textarea rows={3} className="input" placeholder="Minimum 10 characters" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children, full, hint }: { label: string; children: React.ReactNode; full?: boolean; hint?: string }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</span>
        {hint && <span className="text-[11px] text-gold-700">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
