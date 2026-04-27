"use client";

import { useState } from "react";
import { LuBell, LuTriangleAlert, LuCalendar, LuRepeat, LuTarget, LuX } from "react-icons/lu";

export interface Alert {
  id: string;
  type: "budget" | "session" | "recurring" | "goal";
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
}

interface Props {
  alerts: Alert[];
}

const SEVERITY_STYLES = {
  critical: "text-red-400",
  warning:  "text-orange-400",
  info:     "text-blue-400",
};

const TYPE_ICONS = {
  budget:    <LuTriangleAlert size={14} />,
  session:   <LuCalendar size={14} />,
  recurring: <LuRepeat size={14} />,
  goal:      <LuTarget size={14} />,
};

export default function AlertsCenter({ alerts }: Props) {
  const [open, setOpen] = useState(false);
  const count = alerts.length;
  const critical = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        title="Alertas"
      >
        <LuBell size={16} />
        {count > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ${critical > 0 ? "bg-red-500" : "bg-orange-500"}`}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl bg-neutral-900 shadow-xl ring-1 ring-neutral-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <p className="text-sm font-semibold text-white">Alertas</p>
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-white">
                <LuX size={14} />
              </button>
            </div>
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <LuBell size={24} className="mx-auto mb-2 text-neutral-700" />
                <p className="text-sm text-neutral-500">Sin alertas activas</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={`mt-0.5 flex-shrink-0 ${SEVERITY_STYLES[a.severity]}`}>
                      {TYPE_ICONS[a.type]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.title}</p>
                      <p className="text-xs text-neutral-500">{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-neutral-800 px-4 py-2">
              <p className="text-xs text-neutral-600">
                {count === 0 ? "Todo en orden" : `${count} alerta${count !== 1 ? "s" : ""} activa${count !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
