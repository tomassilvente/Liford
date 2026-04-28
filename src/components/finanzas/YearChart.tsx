"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface YearDataPoint {
  month: string;
  ingresos: number;
  gastos: number;
  balance: number;
}

interface Props {
  data: YearDataPoint[];
  currency: "ARS" | "USD";
}

const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", style: "currency", currency: "USD", maximumFractionDigits: 1 }).format(n);

function CustomTooltip({ active, payload, label, currency }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  currency: "ARS" | "USD";
}) {
  if (!active || !payload?.length) return null;
  const fmt = currency === "USD" ? fmtUSD : (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="rounded-xl bg-neutral-800 p-3 shadow-xl ring-1 ring-neutral-700 text-xs space-y-1">
      <p className="font-semibold text-white capitalize mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium text-white tabular-nums">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function YearChart({ data, currency }: Props) {
  const fmt = currency === "USD" ? fmtUSD : fmtARS;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "#737373", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fill: "#737373", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#737373", paddingTop: 12 }}
          formatter={(value) => <span className="text-neutral-400">{value}</span>}
        />
        <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
