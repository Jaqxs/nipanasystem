"use client";
import { useEffect, useState, useRef, forwardRef } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import api from "../lib/api";
import { useCurrency } from "../lib/currency-context";
import { useDateRange } from "../lib/date-range-context";
import logo from "../asset/logo.jpeg";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const TABS = ["All", "Draft", "Sent", "Paid", "Overdue"];

interface Invoice {
  id: string;
  no: string;
  customer: string;
  customerName?: string;
  customerContact?: { name: string; email?: string; phone?: string; location?: string };
  issued: string;
  due: string;
  amount: number;
  status: string;
  items: any[];
  notes: string;
  tax: number;
}

export default function InvoicesPage() {
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [creating, setCreating] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { format } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, contactRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/contacts?type=customer")
      ]);
      setAllInvoices(invRes.data);
      setContacts(contactRes.data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!preview || !invoiceRef.current) return;
    setDownloading(true);
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(invoiceRef.current!, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
        pdf.addImage(imgData, "JPEG", (pageWidth - canvas.width * ratio) / 2, 0, canvas.width * ratio, canvas.height * ratio);
        pdf.save(`Invoice-${preview.no}.pdf`);
      } catch (err) {
        console.error("PDF generation failed", err);
        alert("Failed to generate PDF.");
      } finally {
        setDownloading(false);
      }
    }, 100);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.put(`/invoices/${id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const filtered = allInvoices
    .filter((i) => inRangeFromShortDate(i.issued))
    .filter((i) => tab === "All" || i.status.toLowerCase() === tab.toLowerCase())
    .filter((i) => !search ||
      i.no.toLowerCase().includes(search.toLowerCase()) ||
      (i.customerContact?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.customerName || "").toLowerCase().includes(search.toLowerCase()));

  const totalReceivable = allInvoices.filter((i) => ["sent", "overdue"].includes(i.status.toLowerCase()))
    .reduce((a, b) => a + Number(b.amount), 0);
  const overdue = allInvoices.filter((i) => i.status.toLowerCase() === "overdue").reduce((a, b) => a + Number(b.amount), 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={`Customer invoices and payment status · ${rangeLabel}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-secondary" onClick={() => setReminding(true)}>
              <i className="ri-mail-send-line" /> Send reminders
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-add-line" /> New invoice
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat label="Total receivable" value={format(totalReceivable)} hint="Sent + Overdue" icon="ri-money-dollar-circle-line" />
        <Stat label="Overdue" value={format(overdue)} hint={`${allInvoices.filter(i => i.status.toLowerCase() === "overdue").length} invoices`} icon="ri-error-warning-line" tone="rose" />
        <Stat label="Total Paid" value={format(allInvoices.filter(i => i.status.toLowerCase() === "paid").reduce((a,b) => a + Number(b.amount), 0))} hint="Lifetime revenue" icon="ri-checkbox-circle-line" tone="sage" />
      </div>

      <div className="surface-flat p-3 flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <i className="ri-filter-3-line text-ink-muted" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Filters</span>
        </div>
        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Status</span>
          <select value={tab} onChange={(e) => setTab(e.target.value)} className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            {TABS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {(tab !== "All" || search) && (
          <button onClick={() => { setTab("All"); setSearch(""); }} className="text-xs text-gold-700 hover:underline">
            Clear all
          </button>
        )}
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm surface-flat">
          <i className="ri-search-line text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or customer..."
            className="bg-transparent outline-none w-56 placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr>
              <th>Invoice</th><th>Customer</th><th>Issued</th><th>Due</th>
              <th className="text-right">Amount</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-20 text-ink-faint">Loading invoices...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-ink-faint py-12">No invoices match your filters.</td></tr>
            ) : filtered.map((i) => (
              <tr key={i.id} className="clickable" onClick={() => setPreview(i)}>
                <td className="font-numeric text-ink">{i.no}</td>
                <td className="text-ink-soft">{i.customerContact?.name || i.customerName || "N/A"}</td>
                <td className="text-ink-muted">{new Date(i.issued).toLocaleDateString()}</td>
                <td className="text-ink-muted">{new Date(i.due).toLocaleDateString()}</td>
                <td className="text-right font-numeric text-ink">{format(Number(i.amount))}</td>
                <td><Badge tone={statusToTone(i.status.toLowerCase())}>{i.status}</Badge></td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu actions={[
                    { label: "View invoice", icon: "ri-eye-line", onClick: () => setPreview(i) },
                    ...(i.status.toLowerCase() !== "paid" ? [
                      { label: "Mark as paid", icon: "ri-check-double-line", onClick: () => handleStatusUpdate(i.id, "paid") },
                    ] : []),
                    { label: "Cancel invoice", icon: "ri-close-circle-line", onClick: () => handleStatusUpdate(i.id, "cancelled"), danger: true, divider: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} size="xl"
        eyebrow="Invoice preview" title={preview?.no}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPreview(null)}>Close</button>
            <button 
              className="btn-primary" 
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <><i className="ri-loader-4-line animate-spin" /> Generating...</>
              ) : (
                <><i className="ri-download-line" /> Download PDF</>
              )}
            </button>
          </>
        }>
        {preview && <InvoicePreview invoice={preview} ref={invoiceRef} />}
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} size="lg"
        eyebrow="Section 7 · New invoice" title="Create invoice"
        footer={<><button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button><button className="btn-primary" form="new-invoice-form" disabled={busy}>Save as draft</button></>}>
        <NewInvoiceForm contacts={contacts} onSave={async (p) => {
          setBusy(true);
          try {
            await api.post("/invoices", p);
            setCreating(false);
            fetchData();
          } catch (err) {
            alert("Failed to create invoice. " + ((err as any).response?.data?.message || "Check your connection."));
          } finally {
            setBusy(false);
          }
        }} />
      </Modal>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="invoices" rowCount={filtered.length} />
    </div>
  );
}

const InvoicePreview = forwardRef<HTMLDivElement, { invoice: Invoice }>(({ invoice }, ref) => {
  const { format } = useCurrency();
  return (
    <div ref={ref} className="bg-white p-8">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-line bg-white">
            <img src={logo.src} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-display text-xl text-ink">NIPANA Atlas</div>
            <div className="text-xs text-ink-muted">Mwanza, Tanzania</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-ink">Invoice</div>
          <div className="text-sm text-ink-muted font-numeric">{invoice.no}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Bill to</div>
          <div className="font-medium text-ink">{invoice.customerContact?.name || invoice.customerName || "N/A"}</div>
          <div className="text-sm text-ink-muted">{invoice.customerContact?.location || "N/A"}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Issued · Due</div>
          <div className="text-ink">{new Date(invoice.issued).toLocaleDateString()}</div>
          <div className="text-ink">{new Date(invoice.due).toLocaleDateString()}</div>
        </div>
      </div>

      <table className="ledger">
        <thead>
          <tr><th>Description</th><th className="text-right">Amount</th></tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item: any, idx: number) => (
            <tr key={idx}>
              <td>{item.desc}</td>
              <td className="text-right font-numeric text-ink">{format(item.amount)}</td>
            </tr>
          ))}
          {(!invoice.items || invoice.items.length === 0) && (
             <tr>
               <td>General services/goods</td>
               <td className="text-right font-numeric text-ink">{format(Number(invoice.amount))}</td>
             </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end mt-8">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span className="font-numeric">{format(Number(invoice.amount))}</span></div>
          <div className="divider-rule" />
          <div className="flex justify-between text-ink"><span>Total due</span><span className="font-numeric text-lg">{format(Number(invoice.amount))}</span></div>
        </div>
      </div>
    </div>
  );
});

InvoicePreview.displayName = "InvoicePreview";

function NewInvoiceForm({ contacts, onSave }: { contacts: any[]; onSave: (p: any) => void }) {
  const [formData, setFormData] = useState({
    customer: "",
    customerName: "",
    issued: new Date().toISOString().split('T')[0],
    due: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
    amount: "",
    notes: ""
  });

  return (
    <form id="new-invoice-form" className="space-y-5" onSubmit={(e) => { 
      e.preventDefault(); 
      let finalCust = formData.customer;
      let finalCustName = formData.customerName;
      const matched = contacts.find(c => c.name === formData.customerName);
      if (matched) {
        finalCust = matched.id;
        finalCustName = "";
      }
      onSave({
        ...formData, 
        customer: finalCust || null,
        customerName: finalCustName,
        no: "INV-" + Math.random().toString(36).toUpperCase().slice(2,8)
      }); 
    }}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Customer">
          <input 
            list="invoice-customer-list"
            className="input" 
            placeholder="Type name or select customer..."
            required
            value={formData.customerName}
            onChange={(e) => {
              const val = e.target.value;
              const matched = contacts.find(c => c.name === val);
              setFormData({
                ...formData, 
                customerName: val,
                customer: matched ? matched.id : ""
              });
            }}
          />
          <datalist id="invoice-customer-list">
            {contacts.map(c => <option key={c.id} value={c.name}>{c.location}</option>)}
          </datalist>
        </Field>
        <Field label="Amount">
          <input className="input" type="number" required placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
        </Field>
        <Field label="Issue date"><input type="date" className="input" value={formData.issued} onChange={(e) => setFormData({...formData, issued: e.target.value})} /></Field>
        <Field label="Due date"><input type="date" className="input" value={formData.due} onChange={(e) => setFormData({...formData, due: e.target.value})} /></Field>
      </div>
      <Field label="Notes / payment terms" full><textarea rows={2} className="input" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></Field>
    </form>
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
      <div className={`font-numeric text-[30px] leading-none ${tone === "rose" ? "text-rose-700" : tone === "sage" ? "text-sage-700" : "text-ink"}`}>{value}</div>
      <div className="text-xs text-ink-muted mt-2">{hint}</div>
    </div>
  );
}
