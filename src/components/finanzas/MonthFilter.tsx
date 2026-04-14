"use client";

import { useRouter, usePathname } from "next/navigation";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

interface MonthFilterProps {
  selected: string; // "YYYY-MM"
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

export default function MonthFilter({ selected }: MonthFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  function go(ym: string) {
    router.push(`${pathname}?mes=${ym}`);
  }

  const isCurrentMonth = selected === currentYM();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(addMonths(selected, -1))}
        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
      >
        <LuChevronLeft size={16} />
      </button>
      <span className="min-w-[140px] text-center text-sm font-medium capitalize text-white">
        {getLabel(selected)}
      </span>
      <button
        onClick={() => go(addMonths(selected, 1))}
        disabled={isCurrentMonth}
        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <LuChevronRight size={16} />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => go(currentYM())}
          className="ml-1 rounded-lg px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          Hoy
        </button>
      )}
    </div>
  );
}
