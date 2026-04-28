"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface WealthDataPoint {
  month: string;
  totalARS: number;
  totalUSD: number;
}

function fmtARS(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtUSD(n: number) {
  return `U$S ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function WealthChart({ data }: { data: WealthDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fill: "#737373", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="ars" hide />
        <YAxis yAxisId="usd" orientation="right" hide />
        <Tooltip
          contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#a3a3a3" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) =>
            String(name) === "ARS" ? [fmtARS(value as number), "ARS"] : [fmtUSD(value as number), "USD"]
          }
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: "#a3a3a3" }}>{value}</span>}
        />
        <Line yAxisId="ars" type="monotone" dataKey="totalARS" name="ARS" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: "#60a5fa" }} activeDot={{ r: 5 }} />
        <Line yAxisId="usd" type="monotone" dataKey="totalUSD" name="USD" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
