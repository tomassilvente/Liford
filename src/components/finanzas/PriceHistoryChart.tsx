"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RANGES = [
  { label: "1S", value: "1w" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1A", value: "1y" },
];

interface DataPoint {
  date: string;
  price: number;
}

interface PriceHistoryChartProps {
  ticker: string;
  currentPrice: number | null;
}

export default function PriceHistoryChart({ ticker, currentPrice }: PriceHistoryChartProps) {
  const [range, setRange] = useState("1mo");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/finanzas/cotizaciones/${encodeURIComponent(ticker)}?range=${range}`)
      .then((r) => r.json())
      .then((json) => setData(json.data ?? []))
      .finally(() => setLoading(false));
  }, [ticker, range]);

  const first = data[0]?.price ?? null;
  const last = data[data.length - 1]?.price ?? currentPrice;
  const isUp = first !== null && last !== null && last >= first;
  const color = isUp ? "#4ade80" : "#f87171";

  const minPrice = data.length ? Math.min(...data.map((d) => d.price)) * 0.995 : 0;
  const maxPrice = data.length ? Math.max(...data.map((d) => d.price)) * 1.005 : 0;

  return (
    <div className="mt-4">
      {/* Selector de rango */}
      <div className="mb-3 flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              range === r.value
                ? "bg-neutral-600 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-xs text-neutral-600">
          Cargando...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-neutral-600">
          Sin datos disponibles
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "#525252", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              tick={{ fill: "#525252", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={48}
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
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Precio"]}
              labelStyle={{ color: "#737373" }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${ticker})`}
              dot={false}
              activeDot={{ r: 3, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
