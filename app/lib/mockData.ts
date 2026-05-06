export const fmtCurrency = (n: number, c = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  }).format(n);

export const fmtWeight = (g: number) =>
  g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g.toFixed(1)} g`;

export const KPIS = {
  totalSales: 0,
  totalExpenses: 0,
  netProfit: 0,
  stockWeight: 0,
  stockValue: 0,
  cashPosition: 0,
  pendingInvoices: { count: 0, value: 0 },
  activeQuotations: 0,
};

export const SALES_VS_EXPENSES: any[] = [];
export const PROFIT_TREND: any[] = [];
export const STOCK_BY_PURITY: any[] = [];
export const RECENT_TX: any[] = [];
export const PENDING_INVOICES: any[] = [];
export const ALERTS: any[] = [];
export const INVENTORY_BATCHES: any[] = [];
export const QUOTATIONS: any[] = [];
export const CASH_FLOW: any[] = [];

export const GOLD_PRICE = {
  current: 74.05,
  currency: "USD",
  unit: "per gram",
  source: "N/A",
  asOf: "N/A",
  delta: 0,
  history: [],
};

export const GOLD_FLOW = {
  sold: { weight_g: 0, value_usd: 0, count: 0, spark: [], avgPricePerGram: 0 },
  purchased: { weight_g: 0, value_usd: 0, count: 0, spark: [], avgPricePerGram: 0 },
};

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalPurchases: number;
  outstanding: number;
  status: "active" | "inactive";
  joined: string;
  lastTx: string;
  notes?: string;
}
export const CUSTOMERS: Customer[] = [];

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  location: string;
  totalSupplied_g: number;
  totalPaid: number;
  outstanding: number;
  status: "active" | "inactive";
  joined: string;
  lastDelivery: string;
}
export const SUPPLIERS: Supplier[] = [];
export const ANOMALIES: any[] = [];
