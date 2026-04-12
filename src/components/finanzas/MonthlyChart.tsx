"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

export interface MonthlyDataPoint {
  month: string;
  ingresos: number;
  gastos: number;
}

export default function MonthlyChart({ data }: { data: MonthlyDataPoint[] }) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="#262626" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#525252", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "#525252", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={42}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#171717",
            border: "1px solid #404040",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#fff",
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            Number(value).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }),
            name === "ingresos" ? "Ingresos" : "Gastos",
          ]}
          labelStyle={{ color: "#737373", marginBottom: 4 }}
          cursor={{ fill: "#262626" }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: "#a3a3a3", fontSize: 11 }}>
              {value === "ingresos" ? "Ingresos" : "Gastos"}
            </span>
          )}
        />
        <Bar dataKey="ingresos" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="gastos" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
