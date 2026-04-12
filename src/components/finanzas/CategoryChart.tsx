"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#84cc16",
  "#f97316", "#6366f1",
];

interface CategoryChartProps {
  data: { category: string; total: number }[];
}

export default function CategoryChart({ data }: CategoryChartProps) {
  const totalGlobal = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex-shrink-0">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
              paddingAngle={2} dataKey="total" stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _: any, entry: any) => [
                Number(value).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }),
                entry?.payload?.category ?? "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {data.map((item, i) => {
          const pct = totalGlobal > 0 ? (item.total / totalGlobal) * 100 : 0;
          return (
            <div key={item.category}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-neutral-300">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">{pct.toFixed(0)}%</span>
                  <span className="font-medium text-white w-24 text-right">
                    {item.total.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-neutral-700">
                <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
