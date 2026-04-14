"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface AllocationItem {
  ticker: string;
  name: string | null;
  value: number;
}

const COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#84cc16",
  "#f97316", "#6366f1",
];

interface PortfolioAllocationChartProps {
  items: AllocationItem[];
}

export default function PortfolioAllocationChart({ items }: PortfolioAllocationChartProps) {
  const total = items.reduce((s, i) => s + i.value, 0);

  const data = items
    .filter((i) => i.value > 0)
    .map((i) => ({
      name: i.ticker,
      label: i.name ?? i.ticker,
      value: i.value,
      pct: ((i.value / total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl bg-neutral-800 p-5">
      <p className="mb-1 text-sm font-medium text-white">Distribución del portfolio</p>
      <p className="mb-4 text-xs text-neutral-500">
        Total: ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
      </p>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#171717",
                border: "1px solid #404040",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#fff",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, entry: any) => [
                `$${Number(value).toFixed(2)} (${entry?.payload?.pct ?? ""}%)`,
                entry?.payload?.label ?? "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Leyenda manual */}
        <div className="flex flex-col gap-2 sm:min-w-[160px]">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-neutral-300">{item.name}</span>
              </div>
              <span className="text-xs font-medium text-white">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
