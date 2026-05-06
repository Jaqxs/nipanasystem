"use client";
import { useEffect, useState, useRef } from "react";
import { PageHeader, FilterChip } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import api from "../lib/api";
import { useCurrency } from "../lib/currency-context";
import logo from "../asset/logo.jpeg";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const STATUSES = ["All", "DRAFT", "PENDING", "APPROVED", "ACCEPTED", "EXPIRED", "CONVERTED"];

interface Quote {
  id: string;
  no: string;
  customer: string;
  customerName?: string;
  customerContact?: { name: string; email?: string; phone?: string; location?: string };
  issued: string;
  expires: string;
  amount: number;
  status: string;
  items: any[];
  notes: string;
}

export default function QuotationsPage() {
  const [tab, setTab] = useState("All");
  const [detail, setDetail] = useState<Quote | null>(null);
  const [creating, setCreating] = useState(false);
  const [converting, setConverting] = useState<Quote | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { format } = useCurrency();
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quoteRes, contactRes] = await Promise.all([
        api.get("/quotations"),
        api.get("/contacts?type=customer")
      ]);
      setAllQuotes(quoteRes.data);
      setContacts(contactRes.data);
    } catch (err) {
      console.error("Failed to fetch quotations", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!detail || !quoteRef.current) return;
    setDownloading(true);
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(quoteRef.current!, {
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
        pdf.save(`Quotation-${detail.no}.pdf`);
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
      await api.put(`/quotations/${id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleConvertToInvoice = async () => {
    if (!converting) return;
    setBusy(true);
    try {
      await api.put(`/quotations/${converting.id}`, { status: "CONVERTED" });
      alert("Quotation converted successfully. Check Invoices page.");
      setConverting(null);
      fetchData();
    } catch (err) {
      alert("Conversion failed.");
    } finally {
      setBusy(false);
    }
  };

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "All" ? allQuotes.length : allQuotes.filter((q) => q.status.toUpperCase() === s).length;
    return acc;
  }, {});

  const filtered = tab === "All" ? allQuotes : allQuotes.filter((q) => q.status.toUpperCase() === tab);

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Price quotations. Accepted ones convert directly to invoices."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-add-line" /> New quotation
            </button>
          </>
        }
      />

      <div className="surface-flat p-1 inline-flex gap-1 mb-4 flex-wrap">
        {STATUSES.map((s) => (
          <FilterChip key={s} active={tab === s} onClick={() => setTab(s)}>
            {s}{tab !== s && counts[s] ? <span className="ml-1.5 text-ink-faint">{counts[s]}</span> : null}
          </FilterChip>
        ))}
      </div>

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr><th>Quote</th><th>Customer</th><th>Expires</th><th className="text-right">Amount</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-20 text-ink-faint">Loading quotations...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-ink-faint py-12">No quotations match your filters.</td></tr>
            ) : filtered.map((q) => (
              <tr key={q.id} className="clickable" onClick={() => setDetail(q)}>
                <td className="font-numeric text-ink">{q.no}</td>
                <td className="text-ink-soft">{q.customerContact?.name || q.customerName || "N/A"}</td>
                <td className="text-ink-muted">{new Date(q.expires).toLocaleDateString()}</td>
                <td className="text-right font-numeric text-ink">{format(Number(q.amount))}</td>
                <td><Badge tone={statusToTone(q.status.toUpperCase())}>{q.status}</Badge></td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu actions={[
                    { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(q) },
                    ...(q.status.toUpperCase() === "ACCEPTED" ? [
                      { label: "Convert to invoice", icon: "ri-arrow-right-line", onClick: () => setConverting(q) },
                    ] : []),
                    { label: "Approve", icon: "ri-check-line", onClick: () => handleStatusUpdate(q.id, "APPROVED") },
                    { label: "Reject", icon: "ri-close-line", onClick: () => handleStatusUpdate(q.id, "REJECTED"), danger: true },
                    { label: "Archive", icon: "ri-archive-line", onClick: () => handleStatusUpdate(q.id, "EXPIRED"), danger: true, divider: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} size="lg"
        eyebrow="Quotation" title={detail?.no}
        footer={<>
          <button className="btn-secondary" onClick={() => setDetail(null)}>Close</button>
          <button 
            className="btn-secondary" 
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <><i className="ri-loader-4-line animate-spin" /> Generating...</>
            ) : (
              <><i className="ri-download-line" /> Download PDF</>
            )}
          </button>
          {detail?.status.toUpperCase() === "ACCEPTED" && (
            <button className="btn-primary" onClick={() => { setConverting(detail); setDetail(null); }}>
              <i className="ri-arrow-right-line" />Convert to invoice
            </button>
          )}
        </>}>
        {detail && (
          <div ref={quoteRef} className="bg-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-line bg-white">
                <img src={logo.src} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-display text-xl text-ink">NIPANA Atlas</div>
                <div className="text-xs text-ink-muted">Mwanza, Tanzania</div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-8">
              <Badge tone={statusToTone(detail.status.toUpperCase())}>{detail.status}</Badge>
              <span className="text-sm text-ink-muted font-numeric">No: {detail.no}</span>
            </div>
            <dl className="grid grid-cols-2 gap-8 text-sm mb-8">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Bill to</dt>
                <dd className="font-medium text-ink">{detail.customerContact?.name || detail.customerName || "N/A"}</dd>
                <dd className="text-ink-muted">{detail.customerContact?.location || "N/A"}</dd>
              </div>
              <div className="text-right">
                <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Expires</dt>
                <dd className="text-ink">{new Date(detail.expires).toLocaleDateString()}</dd>
              </div>
            </dl>
            <table className="ledger">
              <thead><tr><th>Description</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                <tr>
                   <td>{detail.notes || "Professional services/goods quotation"}</td>
                   <td className="text-right font-numeric text-ink">{format(Number(detail.amount))}</td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-end mt-8">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-ink"><span>Total Quote</span><span className="font-numeric text-lg">{format(Number(detail.amount))}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!converting} onClose={() => setConverting(null)}
        eyebrow="Confirm" title="Convert quotation to invoice"
        footer={<>
          <button className="btn-secondary" onClick={() => setConverting(null)}>Cancel</button>
          <button className="btn-primary" onClick={handleConvertToInvoice} disabled={busy}>
             {busy ? <i className="ri-loader-4-line animate-spin mr-2" /> : <i className="ri-check-line mr-2" />}
             Create invoice
          </button>
        </>}>
        {converting && (
          <p className="text-sm text-ink-soft">
            The quotation <span className="font-numeric text-ink">{converting.no}</span> will be converted into an invoice.
          </p>
        )}
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} size="lg"
        eyebrow="New quotation" title="Create quotation"
        footer={<><button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button><button className="btn-primary" form="new-quote-form" disabled={busy}>Save as draft</button></>}>
        <NewQuoteForm contacts={contacts} onSave={async (p) => {
          setBusy(true);
          try {
            await api.post("/quotations", p);
            setCreating(false);
            fetchData();
          } catch (err) {
            alert("Failed to create quotation. " + ((err as any).response?.data?.message || "Check your connection."));
          } finally {
            setBusy(false);
          }
        }} />
      </Modal>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="quotations" rowCount={filtered.length} />
    </div>
  );
}

function NewQuoteForm({ contacts, onSave }: { contacts: any[]; onSave: (p: any) => void }) {
  const [formData, setFormData] = useState({
    customer: "",
    customerName: "",
    expires: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
    amount: "",
    notes: ""
  });

  return (
    <form id="new-quote-form" className="space-y-5" onSubmit={(e) => { 
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
        no: "QT-" + Math.random().toString(36).toUpperCase().slice(2,8)
      }); 
    }}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Customer">
          <input 
            list="quote-customer-list"
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
          <datalist id="quote-customer-list">
            {contacts.map(c => <option key={c.id} value={c.name}>{c.location}</option>)}
          </datalist>
        </Field>
        <Field label="Amount">
          <input className="input" type="number" required placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
        </Field>
        <Field label="Expiry date"><input type="date" className="input" value={formData.expires} onChange={(e) => setFormData({...formData, expires: e.target.value})} /></Field>
      </div>
      <Field label="Notes / description" full><textarea rows={3} className="input" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></Field>
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
