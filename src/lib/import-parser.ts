/**
 * Import parser for financial data.
 * Supports: Excel (.xlsx), JSON, and Money Manager .mmbackup (SQLite).
 */

export interface ImportedTransaction {
  date: string;       // ISO date string YYYY-MM-DD
  type: "EXPENSE" | "INCOME";
  amount: number;
  currency: "ARS" | "USD";
  category: string;
  description: string;
  source: "PERSONAL";
}

// ─── Excel (SheetJS) ─────────────────────────────────────────────────────────

export function parseExcel(buffer: ArrayBuffer): ImportedTransaction[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx") as typeof import("xlsx");
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return rows.flatMap((row) => {
    const tx = rowToTransaction(row);
    return tx ? [tx] : [];
  });
}

function rowToTransaction(row: Record<string, unknown>): ImportedTransaction | null {
  // Try to find columns by common names (case-insensitive)
  const get = (keys: string[]) => {
    for (const key of Object.keys(row)) {
      if (keys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        return row[key];
      }
    }
    return undefined;
  };

  const rawDate = get(["fecha", "date", "dia", "day"]);
  const rawAmount = get(["monto", "amount", "importe", "valor", "value"]);
  const rawType = get(["tipo", "type", "categoria tipo"]);
  const rawCategory = get(["categoría", "categoria", "category", "rubro"]);
  const rawDescription = get(["descripcion", "descripción", "description", "detalle", "detail", "nota", "note"]);
  const rawCurrency = get(["moneda", "currency", "divisa"]);

  if (!rawDate || rawAmount === undefined || rawAmount === "") return null;

  const amount = Math.abs(Number(rawAmount));
  if (isNaN(amount) || amount === 0) return null;

  const date = parseDate(rawDate);
  if (!date) return null;

  // Infer type from amount sign if not explicit
  let type: "EXPENSE" | "INCOME" = "EXPENSE";
  if (rawType) {
    const t = String(rawType).toLowerCase();
    if (t.includes("ingreso") || t.includes("income") || t.includes("entrada")) type = "INCOME";
  } else if (Number(rawAmount) > 0) {
    type = "INCOME";
  }

  const currency = parseCurrency(rawCurrency);
  const category = rawCategory ? String(rawCategory).trim() : "Otro";
  const description = rawDescription ? String(rawDescription).trim() : "";

  return { date, type, amount, currency, category, description, source: "PERSONAL" };
}

// ─── JSON ────────────────────────────────────────────────────────────────────

export function parseJSON(text: string): ImportedTransaction[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("JSON inválido");
  }

  const arr = Array.isArray(data) ? data : (data as Record<string, unknown>).transactions ?? (data as Record<string, unknown>).data ?? [];
  if (!Array.isArray(arr)) throw new Error("El JSON debe contener un array de transacciones");

  return (arr as Record<string, unknown>[]).flatMap((row) => {
    const tx = rowToTransaction(row);
    return tx ? [tx] : [];
  });
}

// ─── Money Manager .mmbackup (SQLite inside ZIP) ─────────────────────────────
//
// File format: 8-byte proprietary prefix + ZIP archive
// ZIP contains: MyFinance.db (SQLite) + backup_meta (JSON)
//
// Relevant tables in MyFinance.db:
//   transaction  — uid, type ("Income"|"Expense"), amountInAccountCurrency (centavos),
//                  accountCurrencyCode, date (YYYY-MM-DD), comment, isRemoved
//   category     — uid, title (custom) or "" (default), type
//   sync_link    — entityType="Transaction", entityUid, otherType="Category", otherUid
//
// Default category UIDs shipped by the app (title is always ""):
const DEFAULT_CATEGORY_NAMES: Record<string, string> = {
  DefaultSalary:    "Sueldo",
  DefaultPercents:  "Intereses",
  DefaultEducation: "Educación",
  DefaultHome:      "Hogar",
  DefaultFamily:    "Familia",
  DefaultTransport: "Transporte",
  DefaultPresents:  "Regalos",
  DefaultHealth:    "Salud",
  DefaultLeisure:   "Entretenimiento",
  DefaultCafe:      "Café",
  DefaultPresent:   "Regalo",
  DefaultSport:     "Deporte",
  DefaultProducts:  "Compras",
  other_income:     "Otro ingreso",
  other_expense:    "Otro",
};

interface MMTransaction {
  uid: string;
  type: string;
  amountInDefaultCurrency: number | null;
  amountInAccountCurrency: number | null;
  accountCurrencyCode: string | null;
  amountInRealCurrency: number | null;
  realCurrencyCode: string | null;
  date: string;
  comment: string | null;
  isRemoved: number;
}

interface MMCategory {
  uid: string;
  title: string;
}

interface MMSyncLink {
  entityUid: string;
  otherUid: string;
}

export function parseMmbackup(buffer: ArrayBuffer): ImportedTransaction[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AdmZip = require("adm-zip") as typeof import("adm-zip");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");

  const nodeBuffer = Buffer.from(buffer);

  // Find ZIP magic bytes (PK\x03\x04) — app prepends 8 proprietary bytes
  const pkOffset = nodeBuffer.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  if (pkOffset === -1) throw new Error("No se encontró un archivo ZIP válido dentro del .mmbackup");

  const zip = new AdmZip(nodeBuffer.subarray(pkOffset));
  const entry = zip.getEntry("MyFinance.db");
  if (!entry) throw new Error("El .mmbackup no contiene MyFinance.db");

  const dbBuffer = zip.readFile(entry);
  if (!dbBuffer) throw new Error("No se pudo leer MyFinance.db del archivo");

  const db = new Database(dbBuffer);

  // ── Category map: uid → display name ──────────────────────────────────────
  const categoryMap = new Map<string, string>();
  try {
    const cats = db.prepare("SELECT uid, title FROM category WHERE isRemoved=0").all() as MMCategory[];
    for (const c of cats) {
      const name = c.title?.trim() || DEFAULT_CATEGORY_NAMES[c.uid] || "Otro";
      categoryMap.set(c.uid, name);
    }
  } catch { /* ignore */ }

  // ── Transaction → Category map via sync_link ───────────────────────────────
  const txCategoryMap = new Map<string, string>();
  try {
    const links = db.prepare(
      "SELECT entityUid, otherUid FROM sync_link WHERE entityType='Transaction' AND otherType='Category' AND isRemoved=0"
    ).all() as MMSyncLink[];
    for (const l of links) {
      txCategoryMap.set(l.entityUid, categoryMap.get(l.otherUid) ?? "Otro");
    }
  } catch { /* ignore */ }

  // ── Read transactions ──────────────────────────────────────────────────────
  let records: MMTransaction[] = [];
  try {
    records = db.prepare(
      "SELECT uid, type, amountInDefaultCurrency, amountInAccountCurrency, accountCurrencyCode, amountInRealCurrency, realCurrencyCode, date, comment, isRemoved FROM 'transaction' WHERE isRemoved=0"
    ).all() as MMTransaction[];
  } catch {
    throw new Error("No se encontró la tabla 'transaction' en MyFinance.db");
  }

  db.close();

  return records.flatMap((r) => {
    // Skip crypto accounts (accountCurrencyCode starts with "ct:")
    if (r.accountCurrencyCode?.startsWith("ct:")) return [];

    // Date is already YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return [];

    // Resolve currency and raw centavo amount:
    // Case 1: accountCurrencyCode is set (ARS or USD) → use amountInAccountCurrency
    // Case 2: realCurrencyCode is "USD" and amountInRealCurrency is set → USD, use amountInRealCurrency
    // Case 3: both null → ARS, fall back to amountInDefaultCurrency
    let rawCents: number | null;
    let currency: "ARS" | "USD";

    if (r.accountCurrencyCode === "USD") {
      rawCents = r.amountInAccountCurrency;
      currency = "USD";
    } else if (r.accountCurrencyCode === "ARS") {
      rawCents = r.amountInAccountCurrency;
      currency = "ARS";
    } else if (r.realCurrencyCode === "USD" && r.amountInRealCurrency != null) {
      rawCents = r.amountInRealCurrency;
      currency = "USD";
    } else {
      rawCents = r.amountInDefaultCurrency;
      currency = "ARS";
    }

    const amount = Math.abs(rawCents ?? 0) / 100;
    if (!amount) return [];

    const type: "EXPENSE" | "INCOME" = r.type === "Income" ? "INCOME" : "EXPENSE";
    const category = txCategoryMap.get(r.uid) ?? "Otro";
    const description = r.comment?.trim() ?? "";

    return [{ date: r.date, type, amount, currency, category, description, source: "PERSONAL" }];
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(raw: unknown): string | null {
  if (!raw) return null;

  // JS Date from xlsx cellDates
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return null;
    return raw.toISOString().slice(0, 10);
  }

  const s = String(raw).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;

  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;

  // Try native Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return null;
}

function parseCurrency(raw: unknown): "ARS" | "USD" {
  if (!raw) return "ARS";
  const s = String(raw).toUpperCase().trim();
  if (s.includes("USD") || s.includes("DOLAR") || s === "U$S" || s === "US$") return "USD";
  return "ARS";
}
