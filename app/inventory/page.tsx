"use client";
import { useEffect, useState } from "react";
import { PageHeader, FilterChip } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { InventoryAreaChart, StockByPurityChart } from "../components/Charts";
import api from "../lib/api";
import { useCurrency } from "../lib/currency-context";
import { fmtWeight, GOLD_PRICE } from "../lib/mockData";

interface Batch {
  id: string;
  batchNo: string;
  weight: number;
  karat: number;
  fine: number;
  location: string;
  status: string;
  value: number;
  source?: string;
  sourceName?: string;
  sourceContact?: { name: string };
  history: any[];
}

export default function InventoryPage() {
  const [tab, setTab] = useState<"batches" | "movements">("batches");
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState<Batch | null>(null);
  const [purity, setPurity] = useState("All");
  const [location, setLocation] = useState("All");
  const [confirm, setConfirm] = useState<{ batch: Batch; action: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [goldPrice, setGoldPrice] = useState(GOLD_PRICE.current);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { format, formatUSD } = useCurrency();

  const [formData, setFormData] = useState({
    weight: "",
    karat: "24",
    location: "Vault A",
    source: "", // ID
    sourceName: "", // Text
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, contactRes, settingsRes] = await Promise.all([
        api.get("/inventory"),
        api.get("/contacts?type=supplier"),
        api.get("/settings")
      ]);
      setAllBatches(invRes.data);
      setContacts(contactRes.data);
      if (settingsRes.data?.goldPriceUSD) {
        setGoldPrice(settingsRes.data.goldPriceUSD);
      }
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.weight || (!formData.source && !formData.sourceName)) {
      return alert("Weight and Source are required.");
    }
    setBusy(true);
    try {
      let finalSource = formData.source;
      let finalSourceName = formData.sourceName;

      const matched = contacts.find(c => c.name === formData.sourceName);
      if (matched) {
        finalSource = matched.id;
        finalSourceName = "";
      }

      const payload = {
        ...formData,
        source: finalSource || null,
        sourceName: finalSourceName,
        batchNo: "BATCH-" + new Date().toISOString().slice(0,10).replace(/-/g,'') + "-" + Math.random().toString(36).slice(2,6).toUpperCase(),
        weight: Number(formData.weight),
        karat: formData.karat === "Raw" ? 0 : Number(formData.karat),
        value: Number(formData.weight) * goldPrice
      };
      await api.post("/inventory", payload);
      setAdding(false);
      setFormData({ weight: "", karat: "24", location: "Vault A", source: "", sourceName: "", notes: "" });
      fetchData();
    } catch (err) {
      alert("Failed to create batch. " + ((err as any).response?.data?.message || "Check your connection."));
    } finally {
      setBusy(false);
    }
  };

  const handleAction = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === "archive") {
        await api.put(`/inventory/${confirm.batch.id}`, { status: "Sold" });
      }
      setConfirm(null);
      fetchData();
    } catch (err) {
      alert("Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const totalWeight = allBatches.reduce((a, b) => a + Number(b.weight), 0);
  const fineWeight = allBatches.reduce((a, b) => a + Number(b.fine), 0);
  const totalValue = allBatches.reduce((a, b) => a + Number(b.value), 0);

  const PURITIES = ["All", "24K", "22K", "18K", "Raw"];
  const LOCATIONS = ["All", "Vault A", "Vault B", "Processing", "In Transit"];

  const filteredBatches = allBatches
    .filter((b) => purity === "All" || (purity === "Raw" ? b.karat === 0 : `${b.karat}K` === purity))
    .filter((b) => location === "All" || b.location === location);

  const allMovements = allBatches.flatMap(b => (b.history || []).map(h => ({ ...h, b: b.batchNo })));

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Batches across vaults and transit, auto-valued at the active gold price."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <i className="ri-add-line" /> Add batch
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Total stock weight</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{fmtWeight(totalWeight)}</div>
          <div className="text-xs text-ink-muted mt-2">{allBatches.length} active batches</div>
        </div>
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Total fine weight</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{fmtWeight(fineWeight)}</div>
          <div className="text-xs text-ink-muted mt-2">Pure gold equivalent</div>
        </div>
        <div className="surface p-5" style={{ background: "#fdf6e4" }}>
          <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700">Stock value</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{format(totalValue)}</div>
          <div className="text-xs text-gold-700 mt-2">@ {formatUSD(goldPrice)}/g (USD)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">By purity</div>
          <div className="font-display text-lg text-ink mb-2">Composition</div>
          <StockByPurityChart data={allBatches} />
        </div>
        <div className="lg:col-span-2 surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">24-hour stock level</div>
          <div className="font-display text-lg text-ink mb-2">Movement over time</div>
          <InventoryAreaChart data={allBatches} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="surface-flat p-1 inline-flex gap-1">
          <FilterChip active={tab === "batches"} onClick={() => setTab("batches")}>Batches</FilterChip>
          <FilterChip active={tab === "movements"} onClick={() => setTab("movements")}>Movement log</FilterChip>
        </div>
        {tab === "batches" && (
          <>
            <div className="surface-flat p-1 inline-flex gap-1">
              {PURITIES.map((p) => <FilterChip key={p} active={purity === p} onClick={() => setPurity(p)}>{p}</FilterChip>)}
            </div>
            <div className="surface-flat p-1 inline-flex gap-1">
              {LOCATIONS.map((l) => <FilterChip key={l} active={location === l} onClick={() => setLocation(l)}>{l}</FilterChip>)}
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="surface p-20 flex flex-col items-center justify-center text-ink-faint">
           <i className="ri-loader-4-line animate-spin text-3xl mb-2" />
           Loading inventory...
        </div>
      ) : tab === "batches" ? (
        <div className="surface">
          <table className="ledger">
            <thead>
              <tr><th>Batch</th><th>Weight</th><th>Karat</th><th>Fine wt.</th><th>Source</th><th>Location</th><th>Status</th><th className="text-right">Value</th><th /></tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-ink-faint py-12">No batches match these filters.</td></tr>
              ) : filteredBatches.map((b) => (
                <tr key={b.id} className="clickable" onClick={() => setDetail(b)}>
                  <td className="font-numeric text-ink">{b.batchNo}</td>
                  <td className="font-numeric">{Number(b.weight).toFixed(2)} g</td>
                  <td>{b.karat ? `${b.karat}K` : "Raw"}</td>
                  <td className="font-numeric">{Number(b.fine).toFixed(2)} g</td>
                  <td className="text-ink-soft">{b.sourceContact?.name || b.sourceName || "N/A"}</td>
                  <td className="text-ink-muted">{b.location}</td>
                  <td><Badge tone={statusToTone(b.status.toLowerCase())}>{b.status}</Badge></td>
                  <td className="text-right font-numeric text-ink">{b.value ? format(Number(b.value)) : "—"}</td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu actions={[
                      { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(b) },
                      { label: "Archive batch", icon: "ri-archive-line", onClick: () => setConfirm({ batch: b, action: "archive" }), danger: true, divider: true },
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
              <tr><th>Time</th><th>Batch</th><th>Movement</th><th>Before</th><th>Δ</th><th>After</th><th>By</th><th /></tr>
            </thead>
            <tbody>
              {allMovements.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-20 text-ink-faint">No movements recorded in history.</td></tr>
              ) : allMovements.map((r, i) => (
                <tr key={i}>
                  <td className="text-ink-muted">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="font-numeric text-ink">{r.b}</td>
                  <td>{r.action}</td>
                  <td className="font-numeric text-ink-muted">{(r.before || 0).toFixed(1)}</td>
                  <td className={`font-numeric ${(r.change || 0) < 0 ? "text-rose-700" : (r.change || 0) > 0 ? "text-sage-700" : "text-ink-muted"}`}>
                    {(r.change || 0) > 0 ? "+" : ""}{(r.change || 0).toFixed(1)} g
                  </td>
                  <td className="font-numeric text-ink">{(r.after || 0).toFixed(1)}</td>
                  <td className="text-ink-soft">{r.by || "System"}</td>
                  <td className="text-right">
                    <button className="text-xs text-gold-700 hover:underline">View linked</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)}
        eyebrow="Inventory" title="Add new batch"
        footer={<><button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button><button className="btn-primary" onClick={handleCreate} disabled={busy}>{busy ? <i className="ri-loader-4-line animate-spin mr-2" /> : <i className="ri-check-line mr-2" />}Save batch</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Batch ID"><input className="input" placeholder="Auto-generated" disabled /></Field>
          <Field label="Weight (grams)"><input className="input" type="number" placeholder="0.000" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} /></Field>
          <Field label="Purity">
            <select className="input" value={formData.karat} onChange={(e) => setFormData({...formData, karat: e.target.value})}>
              <option value="24">24K</option><option value="22">22K</option><option value="18">18K</option><option value="Raw">Raw</option>
            </select>
          </Field>
          <Field label="Location">
            <select className="input" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}>
              <option>Vault A</option><option>Vault B</option><option>Processing</option><option>In Transit</option>
            </select>
          </Field>
          <Field label="Source Supplier" full>
            <input 
              list="supplier-list"
              className="input" 
              placeholder="Type name or select supplier..."
              value={formData.sourceName}
              onChange={(e) => {
                const val = e.target.value;
                const matched = contacts.find(c => c.name === val);
                setFormData({
                  ...formData, 
                  sourceName: val,
                  source: matched ? matched.id : ""
                });
              }}
            />
            <datalist id="supplier-list">
              {contacts.map(c => <option key={c.id} value={c.name}>{c.type}</option>)}
            </datalist>
          </Field>
          <Field label="Notes / quality" full>
            <textarea rows={2} className="input" placeholder="Optional assay notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
          </Field>
        </div>
      </Modal>

      <BatchDetailModal batch={detail} onClose={() => setDetail(null)} format={format} formatUSD={formatUSD} />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="inventory batches" rowCount={filteredBatches.length} />

      <Modal open={!!confirm} onClose={() => setConfirm(null)}
        eyebrow={confirm?.action} title={confirm ? `${confirm.action[0].toUpperCase() + confirm.action.slice(1)} ${confirm.batch.batchNo}?` : ""}
        footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn-primary" onClick={handleAction} disabled={busy}>Confirm</button></>}>
        <p className="text-sm text-ink-soft">A movement log entry will be created with full attribution.</p>
      </Modal>
    </div>
  );
}

function BatchDetailModal({ batch, onClose, format, formatUSD }: {
  batch: Batch | null;
  onClose: () => void;
  format: (n: number) => string;
  formatUSD: (n: number) => string;
}) {
  if (!batch) return null;
  const finePct = batch.weight > 0 ? (batch.fine / batch.weight) * 100 : 0;
  const alloyWeight = batch.weight - batch.fine;
  const movements = batch.history || [];

  return (
    <Modal open={!!batch} onClose={onClose} size="xl"
      eyebrow="Batch" title={batch.batchNo}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-secondary"><i className="ri-printer-line" />Print certificate</button>
        <button className="btn-primary"><i className="ri-edit-line" />Adjust</button>
      </>}>
      <div className="surface-flat p-5 mb-5 flex items-start gap-5">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#fdf6e4" }}>
          <i className="ri-archive-2-line text-3xl text-gold-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge tone={statusToTone(batch.status.toLowerCase())}>{batch.status}</Badge>
            <span className="text-xs text-ink-muted">{batch.location}</span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <div className="font-numeric text-[32px] text-ink leading-none">{Number(batch.weight).toFixed(2)}<span className="text-base text-ink-muted ml-1">g gross</span></div>
            <div className="font-numeric text-lg text-ink-soft">{Number(batch.fine).toFixed(2)}<span className="text-xs text-ink-muted ml-1">g fine</span></div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700">Current value</div>
          <div className="font-numeric text-[24px] text-ink leading-none mt-1">{batch.value ? format(Number(batch.value)) : "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="surface-flat p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-3">Composition</div>
          <div className="h-3 rounded-full overflow-hidden bg-paper-200 flex">
            <div className="h-full" style={{ width: `${finePct}%`, background: "#b8893d" }} />
            <div className="h-full" style={{ width: `${100 - finePct}%`, background: "#dcb35a", opacity: 0.5 }} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold-500" />
                <span className="text-ink-muted text-xs">Fine gold</span>
              </div>
              <div className="font-numeric text-ink mt-0.5">{Number(batch.fine).toFixed(2)} g</div>
              <div className="text-[11px] text-ink-faint">{finePct.toFixed(1)}%</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#dcb35a", opacity: 0.5 }} />
                <span className="text-ink-muted text-xs">Alloy</span>
              </div>
              <div className="font-numeric text-ink mt-0.5">{alloyWeight.toFixed(2)} g</div>
              <div className="text-[11px] text-ink-faint">{(100 - finePct).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Properties</div>
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <Row label="Purity" value={batch.karat ? `${batch.karat}K` : "Raw"} />
              <Row label="Location" value={batch.location} />
              <Row label="Status" value={<Badge tone={statusToTone(batch.status.toLowerCase())}>{batch.status}</Badge>} />
            </dl>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Movement history</div>
            <div className="surface-flat overflow-hidden">
              <table className="ledger">
                <thead>
                  <tr><th>When</th><th>Action</th><th>By</th></tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-ink-faint py-6">No history.</td></tr>
                  ) : movements.map((m: any, i: number) => (
                    <tr key={i}>
                      <td className="text-ink-muted">{new Date(m.timestamp).toLocaleDateString()}</td>
                      <td>{m.action}</td>
                      <td className="text-ink-soft">{m.by || "System"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-0.5">{label}</dt>
      <dd className="text-ink">{value}</dd>
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
