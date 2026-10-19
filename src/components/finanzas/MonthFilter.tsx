"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

interface MonthFilterProps {
  selected: string;      // "YYYY-MM"
  prevHasData?: boolean; // muestra dot si el mes anterior tiene movimientos
  nextHasData?: boolean; // muestra dot si el mes siguiente tiene movimientos
}

function getLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentYM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const btnBase: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--rule2)",
  color: "var(--ink3)",
  cursor: "pointer",
  padding: "4px 8px",
  display: "flex",
  alignItems: "center",
  lineHeight: 1,
};

export default function MonthFilter({ selected, prevHasData = false, nextHasData = false }: MonthFilterProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  function go(ym: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", ym);
    router.push(`${pathname}?${params.toString()}`);
  }

  const isCurrentMonth = selected === currentYM();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Mes anterior */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <button onClick={() => go(addMonths(selected, -1))} style={btnBase} title="Mes anterior">
          <LuChevronLeft size={14} />
        </button>
        {prevHasData && (
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--olive)", display: "block" }} />
        )}
      </div>

      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--ink)",
        letterSpacing: "0.06em",
        minWidth: 148,
        textAlign: "center",
        textTransform: "capitalize",
      }}>
        {getLabel(selected)}
      </span>

      {/* Mes siguiente */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <button
          onClick={() => go(addMonths(selected, 1))}
          disabled={isCurrentMonth}
          style={{ ...btnBase, color: isCurrentMonth ? "var(--rule2)" : "var(--ink3)", cursor: isCurrentMonth ? "default" : "pointer" }}
          title="Mes siguiente"
        >
          <LuChevronRight size={14} />
        </button>
        {nextHasData && !isCurrentMonth && (
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--olive)", display: "block" }} />
        )}
      </div>

      {/* Volver al mes actual */}
      {!isCurrentMonth && (
        <button
          onClick={() => go(currentYM())}
          style={{ ...btnBase, padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", marginLeft: 2 }}
        >
          hoy
        </button>
      )}
    </div>
  );
}
