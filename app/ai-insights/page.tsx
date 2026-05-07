"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { ProfitTrendChart } from "../components/Charts";
import { ANOMALIES } from "../lib/mockData";
import api from "../lib/api";

type Anomaly = typeof ANOMALIES[number];

export default function AIInsightsPage() {
  const [anomaly, setAnomaly] = useState<Anomaly | null>(null);
  const [transcript, setTranscript] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reports/briefing");
      setData(data);
    } catch (err) {
      console.error("Failed to fetch AI briefing", err);
    } finally {
      setLoading(false);
    }
  };

  const HERO_METRICS = [
    { label: "Sales recorded", value: `$${data?.metrics?.sales?.toLocaleString() || '0'}`, tone: "ink" },
    { label: "Expenses logged", value: `$${data?.metrics?.expenses?.toLocaleString() || '0'}`, tone: "rose" },
    { label: "Transactions", value: `${data?.metrics?.count || '0'} entries`, tone: "ink" },
    { label: "Items flagged", value: "0", tone: "amber" },
  ];

  const MODEL_CARDS = [
    { label: "Anomalies flagged", value: "0", hint: "this month", icon: "ri-radar-line", tone: "rose" },
    { label: "Auto-categorisation accuracy", value: "94%", hint: "rolling 30-day", icon: "ri-target-line", tone: "sage" },
    { label: "Predictions accepted", value: "88%", hint: "by Admin", icon: "ri-check-double-line", tone: "sage" },
    { label: "Average response", value: "0.4 s", hint: "advisor latency", icon: "ri-flashlight-line", tone: "ink" },
  ];

  const TONE_STYLE: Record<string, string> = {
    ink: "text-ink",
    rose: "text-rose-700",
    sage: "text-sage-700",
    amber: "text-gold-700",
  };

  const CATEGORISATION: any[] = [];

  return (
    <div className="space-y-6">
      <PageHeader title="AI Insights" description="AI flags, suggests, and summarises. It never auto-commits any record." />

      {/* Hero briefing */}
      <div className="surface relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <i className="ri-sparkling-2-fill absolute -right-10 -top-10 text-[260px] text-gold-700" />
        </div>
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "#b8893d" }}
            >
              <i className="ri-sparkling-2-line text-white text-lg" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700">Daily Briefing</div>
              <div className="text-xs text-ink-muted">Generated 06:00 · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <button onClick={() => setTranscript(true)} className="ml-auto btn-ghost">
              <i className="ri-file-text-line" /> Full transcript
            </button>
          </div>

          <div className="text-[19px] leading-[1.55] text-ink max-w-4xl">
            {loading ? "Generating intelligence briefing..." : data?.summary}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {HERO_METRICS.map((m) => (
              <div key={m.label} className="surface-flat p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">{m.label}</div>
                <div className={`font-numeric text-xl mt-1 ${TONE_STYLE[m.tone]}`}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model performance strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MODEL_CARDS.map((c) => (
          <div key={c.label} className="surface p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{c.label}</div>
              <i className={`${c.icon} text-gold-600 text-lg opacity-70`} />
            </div>
            <div className={`font-numeric text-[28px] ${TONE_STYLE[c.tone]} leading-none`}>{c.value}</div>
            <div className="text-xs text-ink-muted mt-2">{c.hint}</div>
          </div>
        ))}
      </div>

      {/* Anomaly feed + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface flex flex-col">
          <div className="px-5 pt-5 flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Anomaly Detection</div>
              <div className="font-display text-lg text-ink">Flagged transactions</div>
              <div className="text-xs text-ink-muted">90-day rolling baseline · 2.5σ threshold</div>
            </div>
            <Badge tone="terracotta">{ANOMALIES.length} open</Badge>
          </div>
          <div className="px-4 pb-4 mt-3 space-y-1.5 flex-1">
            {ANOMALIES.map((a) => (
              <button
                key={a.id}
                onClick={() => setAnomaly(a)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-paper-50 transition group"
                style={{ borderLeft: "3px solid #b56b4a" }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-terracotta-100 text-terracotta-700 shrink-0">
                  <i className="ri-radar-line" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-numeric text-ink text-sm">{a.id}</span>
                    <span className="text-ink-faint">·</span>
                    <span className="text-gold-700 font-medium text-sm">{a.txn}</span>
                    <Badge tone={a.severity === "warning" ? "terracotta" : "amber"}>{a.severity}</Badge>
                    <span className="text-xs text-ink-faint ml-auto">{a.time}</span>
                  </div>
                  <div className="text-sm text-ink-soft">{a.reason}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="surface p-5 flex flex-col">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Forecast</div>
              <div className="font-display text-lg text-ink">Profit · next 30 days</div>
              <div className="text-xs text-ink-muted">Linear regression w/ seasonality</div>
            </div>
            <div className="text-right">
              <div className="font-numeric text-2xl text-sage-700 leading-none">$98.2k</div>
              <div className="text-[11px] text-ink-muted mt-1">projected profit</div>
            </div>
          </div>
          <div className="flex-1 min-h-[200px] mt-3">
            <ProfitTrendChart className="h-full" />
          </div>
          <div className="divider-rule my-3" />
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Revenue</dt>
              <dd className="font-numeric text-ink mt-0.5">$278,400</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Confidence</dt>
              <dd className="font-numeric text-ink mt-0.5">±12.4%</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Trend</dt>
              <dd className="text-sage-700 font-medium mt-0.5 inline-flex items-center gap-1"><i className="ri-arrow-up-line" /> Improving</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Auto-categorisation */}
      <div className="surface">
        <div className="px-5 pt-5 flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Auto-Categorisation</div>
            <div className="font-display text-lg text-ink">Recent AI suggestions</div>
            <div className="text-xs text-ink-muted">TF-IDF + Logistic Regression · trained on 18 months</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="sage" dot>Active</Badge>
            <button className="btn-ghost"><i className="ri-settings-3-line" /> Tune model</button>
          </div>
        </div>
        <table className="ledger mt-2">
          <thead>
            <tr><th>Transaction</th><th>Description</th><th>AI suggested</th><th>Confidence</th><th>Decision</th></tr>
          </thead>
          <tbody>
            {CATEGORISATION.map((c) => (
              <tr key={c.tx}>
                <td className="font-numeric text-ink">{c.tx}</td>
                <td className="text-ink-soft">{c.desc}</td>
                <td>{c.suggested}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-paper-200 overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${c.conf}%`,
                          background: c.conf >= 90 ? "#7a8c6b" : c.conf >= 80 ? "#b8893d" : "#b56b4a",
                        }}
                      />
                    </div>
                    <span className="font-numeric text-xs text-ink-soft">{c.conf}%</span>
                  </div>
                </td>
                <td>
                  <Badge tone={c.decision.startsWith("Accepted") ? "sage" : "info"}>{c.decision}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <Modal open={!!anomaly} onClose={() => setAnomaly(null)}
        eyebrow="Anomaly" title={anomaly?.id}
        footer={<>
          <button className="btn-secondary" onClick={() => setAnomaly(null)}>Close</button>
          <button className="btn-secondary"><i className="ri-eye-line" />Investigate transaction</button>
          <button className="btn-primary" onClick={() => setAnomaly(null)}><i className="ri-check-line" />Mark resolved</button>
        </>}>
        {anomaly && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Row label="Linked transaction" value={anomaly.txn} valueClass="font-numeric" />
            <Row label="Severity" value={<Badge tone={anomaly.severity === "warning" ? "terracotta" : "amber"}>{anomaly.severity}</Badge>} />
            <Row label="Detected" value={anomaly.time} />
            <Row label="Method" value="2.5σ rolling baseline (90 days)" />
            <Row label="Reason" full value={anomaly.reason} />
            <Row label="Recommended action" full value="Review the source transaction. If legitimate, mark as resolved to recalibrate the baseline. If suspicious, escalate to Admin and freeze the linked entry." />
          </dl>
        )}
      </Modal>

      <Modal open={transcript} onClose={() => setTranscript(false)} size="lg"
        eyebrow="AI briefing" title="Full transcript · May 04, 2026"
        footer={<button className="btn-secondary" onClick={() => setTranscript(false)}>Close</button>}>
        <div className="space-y-4 text-sm text-ink-soft leading-relaxed">
          <p>Yesterday recorded 14 confirmed transactions across sale, purchase, and operational categories. Total inflows of $78,050 outpaced outflows of $39,940, lifting net cash position by $38,110 to $178,220.</p>
          <p>Inventory rose by 1.24 kg with the receipt of BATCH-20260503-0042 from Geita Cooperative. The corresponding $22,800 purchase landed in the 90-day baseline as a 2.8σ deviation — buying volume from this supplier has been below $15,000 over the last 30 days.</p>
          <p>Receivables increased by $18,400 (Mwanza Refinery). Two invoices remain overdue: Lake Zone Traders (7 days) and Bulyanhulu Buyers (14 days). Suggested action: send reminder via the Receivables module.</p>
          <p>Gold price was set manually at $74.05 per gram, +$0.42 over the previous day. This is within the normal deviation envelope.</p>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, full, valueClass }: { label: string; value: React.ReactNode; full?: boolean; valueClass?: string }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">{label}</dt>
      <dd className={`text-ink ${valueClass || ""}`}>{value}</dd>
    </div>
  );
}
