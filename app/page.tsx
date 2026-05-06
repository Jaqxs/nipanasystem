"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KpiCard } from "./components/KpiCard";
import { AlertsPanel, AlertItem } from "./components/AlertsPanel";
import { Badge, statusToTone } from "./components/Badge";
import { Modal } from "./components/Modal";
import { PageHeader } from "./components/PageHeader";
import { RowActionsMenu } from "./components/RowActionsMenu";
import { GoldPriceCard } from "./components/GoldPriceCard";
import { ExportModal } from "./components/ExportModal";
import { TransactionDetailModal } from "./components/TransactionDetailModal";
import {
  SalesVsExpensesChart, ProfitTrendChart, StockByPurityChart, GoldPriceSparkline,
} from "./components/Charts";
import api from "./lib/api";
import { useRole } from "./lib/role-context";
import { useCurrency } from "./lib/currency-context";
import { useDateRange } from "./lib/date-range-context";
import { GOLD_PRICE, fmtWeight } from "./lib/mockData";

const QUICK_ACTIONS = [
  { label: "Record Sale", icon: "ri-arrow-up-circle-line", href: "/transactions" },
  { label: "Record Purchase", icon: "ri-arrow-down-circle-line", href: "/transactions" },
  { label: "New Invoice", icon: "ri-file-paper-2-line", href: "/invoices" },
  { label: "New Quotation", icon: "ri-price-tag-3-line", href: "/quotations" },
  { label: "Add Batch", icon: "ri-archive-line", href: "/inventory" },
];

export default function Dashboard() {
  const router = useRouter();
  const { isAdmin } = useRole();
  const { format, formatUSD } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    transactions: [] as any[],
    inventory: [] as any[],
    invoices: [] as any[],
    quotations: [] as any[]
  });

  const [tx, setTx] = useState<any | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [alertDetail, setAlertDetail] = useState<AlertItem | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [txRes, invRes, invcRes, quotRes] = await Promise.all([
        api.get("/transactions"),
        api.get("/inventory"),
        api.get("/invoices"),
        api.get("/quotations")
      ]);
      setData({
        transactions: txRes.data,
        inventory: invRes.data,
        invoices: invcRes.data,
        quotations: quotRes.data
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  // Aggregations
  const filteredTx = data.transactions.filter((t) => inRangeFromShortDate(t.date));
  const totalSales = filteredTx.filter(t => t.type === "Gold Sale").reduce((a, b) => a + Number(b.amount), 0);
  const totalExpenses = Math.abs(filteredTx.filter(t => ["Op. Expense", "Logistics", "Processing"].includes(t.type)).reduce((a, b) => a + Number(b.amount), 0));
  const netProfit = totalSales - totalExpenses;
  
  const stockWeight = data.inventory.reduce((a, b) => a + Number(b.weight), 0);
  const fineWeight = data.inventory.reduce((a, b) => a + Number(b.fine), 0);
  const stockValue = data.inventory.reduce((a, b) => a + Number(b.value), 0);
  
  const pendingInvoices = data.invoices.filter(i => ["sent", "overdue"].includes(i.status.toLowerCase()));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Mwanza Operations · ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Showing ${rangeLabel}`}
        actions={isAdmin && (
          <button onClick={() => setExportOpen(true)} className="btn-secondary">
            <i className="ri-download-cloud-2-line" />
            Export snapshot
          </button>
        )}
      />

      {loading ? (
        <div className="surface p-20 flex flex-col items-center justify-center text-ink-faint">
           <i className="ri-loader-4-line animate-spin text-3xl mb-2" />
           Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard label="Total Sales" value={format(totalSales, { compact: true })} fullValue={format(totalSales)} delta={{ value: "Live", positive: true }} hint="from transactions" icon="ri-arrow-right-up-line" />
            <KpiCard label="Total Expenses" value={format(totalExpenses, { compact: true })} fullValue={format(totalExpenses)} delta={{ value: "Live", positive: false }} hint="from transactions" icon="ri-arrow-right-down-line" />
            <KpiCard label="Net P&L" value={format(netProfit, { compact: true })} fullValue={format(netProfit)} delta={{ value: "Live", positive: netProfit >= 0 }} hint="Estimated" icon="ri-scales-3-line" emphasis="gold" />
            <KpiCard label="Gold Stock" value={fmtWeight(stockWeight)} hint={`${(fineWeight).toFixed(1)}g fine`} icon="ri-archive-stack-line" />
            <KpiCard label="Stock Value" value={format(stockValue, { compact: true })} fullValue={format(stockValue)} hint={`@ ${formatUSD(GOLD_PRICE.current)}/g`} icon="ri-coin-line" />
            <KpiCard label="Pending Invoices" value={pendingInvoices.length.toString()} hint={`${format(pendingInvoices.reduce((a,b)=>a+Number(b.amount),0))} due`} icon="ri-file-paper-2-line" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="surface p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Inventory</div>
                    <div className="font-display text-lg text-ink">Stock by purity</div>
                  </div>
                  <Link href="/inventory" className="text-xs text-gold-700 hover:underline flex items-center gap-1">
                    Manage <i className="ri-arrow-right-line" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 items-center">
                  <StockByPurityChart data={data.inventory} size="large" />
                  <div className="space-y-2">
                    {["24K", "22K", "18K", "Raw"].map((p) => {
                       const val = data.inventory.filter(b => p === "Raw" ? b.karat === 0 : `${b.karat}K` === p).reduce((a,b) => a + Number(b.weight), 0);
                       return (
                        <div key={p} className="flex items-center gap-2 text-sm text-ink-soft">
                          <span className="font-medium">{p}</span>
                          <span className="ml-auto font-numeric text-ink">{val.toFixed(0)}g</span>
                        </div>
                       );
                    })}
                    <div className="divider-rule my-2" />
                    <div className="flex items-center gap-2 text-sm text-ink">
                      <span className="font-medium">Total weight</span>
                      <span className="ml-auto font-numeric">{(stockWeight).toFixed(1)}g</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="surface p-5 flex flex-col flex-1 min-h-[280px]">
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-3">Recent Activity</div>
                <SalesVsExpensesChart data={filteredTx} />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="surface p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Quick Actions</div>
                    <div className="font-display text-lg text-ink">Navigation</div>
                  </div>
                  <i className="ri-flashlight-line text-gold-600 text-xl" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {QUICK_ACTIONS.map((q) => (
                    <button key={q.label} onClick={() => router.push(q.href)} className="action-tile flex items-center gap-3 p-3 surface-flat hover:border-gold-500 transition">
                      <i className={`${q.icon} text-gold-600 text-lg`} />
                      <span className="text-sm font-medium text-ink">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <GoldPriceCard isAdmin={isAdmin} onUpdate={() => setPriceOpen(true)} />
              <AlertsPanel onOpen={setAlertDetail} />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="surface">
            <div className="px-5 pt-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                  Recent Transactions
                </div>
                <div className="font-display text-lg text-ink">{filteredTx.length} entries · {rangeLabel}</div>
              </div>
              <Link href="/transactions" className="text-xs text-gold-700 hover:underline flex items-center gap-1">
                All transactions <i className="ri-arrow-right-line" />
              </Link>
            </div>
            <table className="ledger mt-2">
              <thead>
                <tr>
                  <th>Ref</th><th>Date</th><th>Type</th><th>Counterparty</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {filteredTx.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-ink-faint py-12">No transactions in this date range.</td></tr>
                ) : filteredTx.slice(0, 10).map((t) => (
                  <tr key={t.id} className="clickable" onClick={() => setTx(t)}>
                    <td className="font-numeric text-ink">{t.ref}</td>
                    <td className="text-ink-muted">{new Date(t.date).toLocaleDateString()}</td>
                    <td>{t.type}</td>
                    <td className="text-ink-soft">{t.partyContact?.name || "N/A"}</td>
                    <td className={`text-right font-numeric ${t.amount < 0 ? "text-rose-700" : "text-sage-700"}`}>
                      {t.amount < 0 ? "−" : "+"}{format(Math.abs(Number(t.amount)))}
                    </td>
                    <td><Badge tone={statusToTone(t.status.toLowerCase())}>{t.status}</Badge></td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <RowActionsMenu actions={[
                        { label: "View detail", icon: "ri-eye-line", onClick: () => setTx(t) },
                        { label: "Open in transactions", icon: "ri-external-link-line", onClick: () => router.push("/transactions") },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      <TransactionDetailModal tx={tx} onClose={() => setTx(null)} />

      <Modal open={priceOpen} onClose={() => setPriceOpen(false)} eyebrow="Settings" title="Update gold price"
        footer={<><button className="btn-secondary" onClick={() => setPriceOpen(false)}>Cancel</button><button className="btn-primary" onClick={() => setPriceOpen(false)}>Save</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="New price /g (USD)"><input className="input" placeholder="74.50" /></Field>
          <Field label="Source / reference"><input className="input" placeholder="LBMA · Reuters · Manual" /></Field>
        </div>
      </Modal>

      <AlertDetailModal alert={alertDetail} onClose={() => setAlertDetail(null)} onNavigate={(href) => { setAlertDetail(null); router.push(href); }} />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="dashboard snapshot" rowCount={filteredTx.length} />
    </div>
  );
}

function AlertDetailModal({ alert, onClose, onNavigate }: { alert: AlertItem | null; onClose: () => void; onNavigate: (href: string) => void }) {
  if (!alert) return null;
  const ROUTE: Record<string, { href: string; label: string }> = {
    stock: { href: "/inventory", label: "Open Inventory" },
    anomaly: { href: "/ai-insights", label: "Open AI Insights" },
    invoice: { href: "/invoices", label: "Open Invoices" },
    price: { href: "/settings", label: "Open Gold Price settings" },
    expense: { href: "/cash-flow", label: "Open Cash Flow" },
  };
  const SEVERITY: Record<string, { tone: string; bg: string; fg: string; label: string }> = {
    danger:  { tone: "Critical", bg: "#ecc8be", fg: "#7d3a2a", label: "Critical" },
    warning: { tone: "Warning",  bg: "#f1d9c8", fg: "#8a4d31", label: "Warning"  },
    info:    { tone: "Watch",    bg: "#fbf3df", fg: "#7a571c", label: "Watch"    },
  };
  const route = ROUTE[alert.kind];
  const sev = SEVERITY[alert.severity];

  return (
    <Modal open onClose={onClose} eyebrow="Alert" title={alert.title}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Dismiss</button>
        <button className="btn-primary" onClick={() => onNavigate(route.href)}>
          <i className="ri-arrow-right-line" /> {route.label}
        </button>
      </>}>
      <div className="surface-flat p-4 mb-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: sev.bg, color: sev.fg }}>
          <i className="ri-alert-line text-xl" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: sev.bg, color: sev.fg }}>
              {sev.label}
            </span>
            <span className="text-xs text-ink-muted">Detected {alert.time}</span>
          </div>
          <div className="text-sm text-ink-soft mt-2">{alert.body}</div>
        </div>
      </div>
    </Modal>
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
