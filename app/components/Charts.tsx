"use client";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
  ReferenceArea, Legend, ComposedChart,
} from "recharts";

const tickStyle = { fontSize: 11, fill: "#8a7e6c" };
const gridStroke = "#ece2cf";

const tooltipStyle = {
  contentStyle: {
    background: "#fffdf6",
    border: "1px solid #e8dfcf",
    borderRadius: 10,
    boxShadow: "0 12px 32px -18px rgba(58,49,39,0.22)",
    fontFamily: "Inter",
    fontSize: 12,
    color: "#1f1a14",
    padding: "10px 12px",
  },
  cursor: { fill: "rgba(220, 179, 90, 0.08)" },
  labelStyle: { color: "#8a7e6c", fontWeight: 600, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 },
  itemStyle: { padding: "2px 0" },
};

const tip$ = (v: number) => `$${v.toLocaleString()}`;

export function SalesVsExpensesChart({ data = [] }: { data?: any[] }) {
  // Transform transactions into daily sales/expenses
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartData = days.map(d => ({ day: d, sales: 0, expenses: 0 }));
  
  data.forEach(t => {
     const dateObj = new Date(t.date);
     if (isNaN(dateObj.getTime())) return;
     const dayIdx = (dateObj.getDay() + 6) % 7; // Align to Mon
     const amount = Number(t.amount);
     if (t.type === "Gold Sale") chartData[dayIdx].sales += amount;
     else if (["Op. Expense", "Logistics", "Processing"].includes(t.type)) chartData[dayIdx].expenses += Math.abs(amount);
  });

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <BarChart data={chartData} barCategoryGap={18} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} width={48} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => tip$(v)} />
          <Bar dataKey="sales" fill="#b8893d" radius={[6, 6, 0, 0]} name="Sales" animationDuration={700} />
          <Bar dataKey="expenses" fill="#c89b62" fillOpacity={0.55} radius={[6, 6, 0, 0]} name="Expenses" animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProfitTrendChart({ className = "h-[200px]" }: { className?: string } = {}) {
  return <div className={className}>Profit trend chart placeholder (Live forecast requires more historical data)</div>;
}

export function StockByPurityChart({ size = "default", data = [] }: { size?: "default" | "large"; data?: any[] } = {}) {
  const isLarge = size === "large";
  const purities = [
    { name: "24K", color: "#b8893d" },
    { name: "22K", color: "#c9a15c" },
    { name: "18K", color: "#dcb35a" },
    { name: "Raw", color: "#ece2cf" }
  ];
  const chartData = purities.map(p => ({
    name: p.name,
    value: data.filter(b => p.name === "Raw" ? b.karat === 0 : `${b.karat}K` === p.name).reduce((a,b) => a + Number(b.weight), 0),
    color: p.color
  })).filter(d => d.value > 0);
  const total = chartData.reduce((a, b) => a + b.value, 0);

  return (
    <div className={`${isLarge ? "h-[300px]" : "h-[220px]"} w-full relative`}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData.length ? chartData : [{ name: "No Stock", value: 1, color: "#f0f0f0" }]}
            innerRadius={isLarge ? 78 : 56}
            outerRadius={isLarge ? 124 : 88}
            paddingAngle={3}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            animationDuration={700}
          >
            {chartData.length ? chartData.map((s, i) => <Cell key={i} fill={s.color} />) : <Cell fill="#f0f0f0" />}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [`${v.toFixed(1)} g`, n]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className={`font-numeric ${isLarge ? "text-[32px]" : "text-[24px]"} text-ink leading-none`}>{total.toFixed(0)}g</div>
        <div className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">total stock</div>
      </div>
    </div>
  );
}

export function InventoryAreaChart({ data = [] }: { data?: any[] }) {
  const chartData = [
    { t: "00:00", weight: 0 }, { t: "04:00", weight: 0 }, { t: "08:00", weight: 0 },
    { t: "12:00", weight: 0 }, { t: "16:00", weight: 0 }, { t: "20:00", weight: 0 }
  ];
  const currentTotal = data.reduce((a,b) => a + Number(b.weight), 0);
  chartData.forEach(d => d.weight = currentTotal);
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dcb35a" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#dcb35a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="t" tick={tickStyle} axisLine={false} tickLine={false} interval={1} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}g`} width={44} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => `${v.toFixed(1)} g`} />
          <Area type="monotone" dataKey="weight" stroke="#b8893d" strokeWidth={2} fill="url(#invGrad)" name="Stock weight"
            activeDot={{ r: 5, fill: "#b8893d", stroke: "#fff", strokeWidth: 2 }}
            animationDuration={700} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashFlowWaterfall({ data = [] }: { data?: any[] }) {
  // Use generic data for the waterfall if not provided
  const chartData = [
    { week: "W1", inflow: 45000, outflow: 32000 },
    { week: "W2", inflow: 52000, outflow: 38000 },
    { week: "W3", inflow: 48000, outflow: 41000 },
    { week: "W4", inflow: 61000, outflow: 45000 },
  ];
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="week" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} width={48} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => tip$(v)} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8a7e6c", paddingTop: 6 }} iconType="circle" />
          <Bar dataKey="inflow" name="Inflow" fill="#7a8c6b" radius={[6, 6, 0, 0]} animationDuration={700} />
          <Bar dataKey="outflow" name="Outflow" fill="#b56b4a" fillOpacity={0.85} radius={[6, 6, 0, 0]} animationDuration={900} />
          <ReferenceLine y={0} stroke="#d8cdb6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyRevenueProfitChart() {
  const data = [
    { month: "Dec", rev: 210000, profit: 42000 },
    { month: "Jan", rev: 280000, profit: 68000 },
    { month: "Feb", rev: 245000, profit: 51000 },
    { month: "Mar", rev: 310000, profit: 89000 },
    { month: "Apr", rev: 364900, profit: 85600 },
    { month: "May", rev: 145000, profit: 32000 },
  ];
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} width={48} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => tip$(v)} />
          <Area type="monotone" dataKey="rev" fill="#fdf6e4" stroke="#dcb35a" strokeWidth={2} name="Revenue" />
          <Bar dataKey="profit" barSize={24} fill="#7a8c6b" radius={[4, 4, 0, 0]} name="Net Profit" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportRunsDonut() {
  const data = [
    { name: "Financial", value: 24, color: "#b8893d" },
    { name: "Operations", value: 12, color: "#dcb35a" },
    { name: "Inventory", value: 8, color: "#c89b62" },
    { name: "Audit", value: 6, color: "#7a8c6b" },
    { name: "Customers", value: 4, color: "#a85944" },
  ];
  return (
    <div className="h-[260px] w-full relative">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={65}
            outerRadius={95}
            paddingAngle={4}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            animationDuration={1000}
          >
            {data.map((s, i) => <Cell key={i} fill={s.color} />)}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="font-numeric text-[28px] text-ink leading-none">54</div>
        <div className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">total runs</div>
      </div>
    </div>
  );
}

export function GoldPriceSparkline({ data }: { data: number[] }) {
  const arr = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-[60px] w-full">
      <ResponsiveContainer>
        <AreaChart data={arr} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8893d" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#b8893d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number) => [`$${(v as number).toFixed(2)}`, "Price"]}
            labelFormatter={() => ""}
          />
          <Area type="monotone" dataKey="v" stroke="#b8893d" strokeWidth={2} fill="url(#sparkGrad)"
            activeDot={{ r: 4, fill: "#b8893d", stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
