"use client";

// Fallback icons for categories that don't have one set in the DB
export const DEFAULT_CAT_ICONS: Record<string, string> = {
  "Alimentación": "🛒", "Alimentos": "🛒", "Supermercado": "🛒", "Mercado": "🛒",
  "Restaurantes": "🍔", "Restaurante": "🍔", "Comida": "🍔",
  "Café": "☕", "Cafe": "☕", "Cafetería": "☕",
  "Transporte": "🚗", "Nafta": "⛽", "Combustible": "⛽", "Auto": "🚗",
  "Entretenimiento": "🎬", "Cine": "🎬", "Teatro": "🎭",
  "Salud": "❤️", "Farmacia": "💊", "Médico": "🏥", "Médicos": "🏥",
  "Servicios": "💡", "Servicios del hogar": "🏠", "Electricidad": "⚡", "Gas": "🔥",
  "Ropa": "👕", "Indumentaria": "👕", "Calzado": "👟",
  "Educación": "🎓", "Libros": "📚", "Cursos": "🎓",
  "Suscripciones": "📺", "Streaming": "📺", "Tecnología": "📱", "Software": "💻",
  "Viajes": "✈️", "Viaje": "✈️", "Hotel": "🏨",
  "Hogar": "🏠", "Casa": "🏠", "Alquiler": "🔑",
  "Mascotas": "🐾", "Veterinaria": "🐾",
  "Deporte": "🏋️", "Gym": "🏋️", "Gimnasio": "🏋️",
  "Música": "🎵", "Juegos": "🎮", "Videojuegos": "🎮",
  "Cuidado personal": "🧴", "Peluquería": "💈", "Belleza": "💄",
  "Inversión": "📈", "Inversiones": "📈", "Acciones": "📈",
  "Criptomonedas": "💎", "Crypto": "💎",
  "Regalos": "🎁", "Regalo": "🎁",
  "Impuestos": "🧾", "Banco": "🏦", "Comisiones": "🏦",
  "Otro": "•••", "Otros": "•••", "Varios": "•••",
  // Ingresos
  "Sueldo": "💼", "Salario": "💼",
  "Freelance": "🚀", "Trabajo independiente": "🚀",
  "Fotografía": "📷",
  "Venta": "🏷️", "Ventas": "🏷️",
  "Transferencia recibida": "🏦",
  "Reembolso": "💸",
};

export function catIcon(cat: CatData | undefined, categoryName: string): string {
  if (cat?.icon) return cat.icon;
  return DEFAULT_CAT_ICONS[categoryName] ?? categoryName.slice(0, 1);
}

type TxType = "EXPENSE" | "INCOME" | "STOCK_PURCHASE" | "CRYPTO_PURCHASE";

export interface TxRowData {
  id: string;
  type: TxType;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  source: string;
  date: string;
  isRecurring?: boolean;
  recurrentRuleId?: string | null;
}

export interface CatData {
  name: string;
  icon: string;
  type: string;
  color?: string;
}

interface Props {
  tx: TxRowData;
  catMap: Map<string, CatData>;
  selected: boolean;
  onSelect: () => void;
  onOpenRule: (id: string) => void;
  onCatClick?: (cat: string) => void;
  compact?: boolean;
}

function fmtAmt(n: number, currency: string) {
  if (currency === "ARS")
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " USD";
}

export default function MovementRow({ tx, catMap, selected, onSelect, onOpenRule, onCatClick, compact }: Props) {
  const isExpense = tx.type !== "INCOME";
  const isPhoto = tx.source === "PHOTOGRAPHY";
  const cat = catMap.get(tx.category);
  const iconSz = compact ? 30 : 34;

  // Dates are stored at UTC noon — don't show time
  const d = new Date(tx.date);
  const hh = d.getUTCHours(), mm = d.getUTCMinutes();
  const timeStr = (hh === 12 && mm === 0) ? null : `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: compact ? "8px 12px" : "11px 16px",
        cursor: "pointer",
        background: selected ? "var(--paper2)" : "transparent",
        borderLeft: selected ? "3px solid var(--ink)" : "3px solid transparent",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = "var(--paper2)"; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = selected ? "var(--paper2)" : "transparent"; }}
    >
      {/* Category icon */}
      <div style={{
        width: iconSz, height: iconSz, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: compact ? 14 : 16,
        border: `1.5px solid ${cat?.color ?? "var(--rule2)"}`,
        background: "var(--paper)",
        userSelect: "none",
      }}>
        {catIcon(cat, tx.category)}
      </div>

      {/* Description + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <p style={{
            fontFamily: "var(--font-serif)", fontSize: compact ? 14 : 16, fontWeight: 500,
            color: "var(--ink)", margin: 0, lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {tx.description || tx.category}
          </p>
          {isPhoto && (
            <span style={{
              flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 8,
              color: "var(--navy)", letterSpacing: "0.08em", textTransform: "uppercase",
              border: "1px solid var(--navy)", padding: "1px 4px",
            }}>FOTO</span>
          )}
          {tx.isRecurring && tx.recurrentRuleId && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenRule(tx.recurrentRuleId!); }}
              style={{
                flexShrink: 0, background: "transparent",
                border: "1px solid var(--rule2)",
                color: "var(--navy)", cursor: "pointer",
                fontFamily: "var(--font-mono)", fontSize: 10,
                letterSpacing: "0.06em", padding: "1px 5px",
              }}
              title="Ver regla recurrente"
            >
              ↻ mensual
            </button>
          )}
        </div>
        <p
          onClick={onCatClick ? (e) => { e.stopPropagation(); onCatClick(tx.category); } : undefined}
          style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13,
            color: "var(--ink3)", margin: "2px 0 0",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            cursor: onCatClick ? "pointer" : "default",
          }}
        >
          {tx.category}
        </p>
      </div>

      {/* Amount + optional time */}
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: 15,
          color: isExpense ? "var(--brick)" : "var(--olive)",
          fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
          margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em",
        }}>
          {isExpense ? "−" : "+"}&thinsp;{fmtAmt(tx.amount, tx.currency)}
        </p>
        {timeStr && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "3px 0 0", letterSpacing: "0.06em" }}>
            {timeStr}
          </p>
        )}
      </div>
    </div>
  );
}
