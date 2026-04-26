export interface MPImportedTransaction {
  date: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  currency: "ARS" | "USD";
  category: string;
  description: string;
  source: "PERSONAL";
  mpId: string;
}

const MP_BASE = "https://api.mercadopago.com";

function getToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado en .env");
  return token;
}

async function mpGet(path: string): Promise<unknown> {
  const token = getToken();
  const res = await fetch(`${MP_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mercado Pago ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function getMyUserId(): Promise<number | null> {
  try {
    const data = await mpGet("/v1/users/me") as { id?: number };
    const id = Number(data.id ?? 0);
    return id > 0 ? id : null;
  } catch {
    return null;
  }
}

// Infiero mi ID contando frecuencias: el ID que más aparece como payer o collector
// es el del usuario autenticado, ya que está en CADA transacción
function inferMyIdFromResults(results: Record<string, unknown>[]): number | null {
  const freq = new Map<number, number>();

  for (const p of results) {
    const payerId = Number(p.payer_id ?? 0);
    if (payerId > 0) freq.set(payerId, (freq.get(payerId) ?? 0) + 1);

    const collectorId = Number((p.collector as Record<string, unknown>)?.id ?? 0);
    if (collectorId > 0) freq.set(collectorId, (freq.get(collectorId) ?? 0) + 1);
  }

  let maxCount = 0;
  let myId: number | null = null;
  for (const [id, count] of freq) {
    if (count > maxCount) { maxCount = count; myId = id; }
  }

  return myId;
}

// Determina la dirección del pago
function isExpensePayment(p: Record<string, unknown>, myId: number | null): boolean {
  const poi = p.point_of_interaction as Record<string, unknown> | undefined;
  const biz = poi?.business_info as Record<string, unknown> | undefined;
  const subUnit = String(biz?.sub_unit ?? "").toLowerCase();
  const subType = String(poi?.sub_type ?? "").toLowerCase();
  const opType = String(p.operation_type ?? "").toLowerCase();
  const payerId = Number(p.payer_id ?? 0);
  const collectorId = Number((p.collector as Record<string, unknown>)?.id ?? 0);
  // Si el objeto payer existe y tiene datos, el pago viene DE alguien (ingreso)
  const payerObjExists = p.payer != null && typeof p.payer === "object" &&
    Object.keys(p.payer as object).length > 0;

  let reason = "";
  let result: boolean;

  // SEÑAL MÁS CONFIABLE:
  // Cuando payer_id=0 y collector.id=0 pero payerObj=true → cobro recibido (INGRESO)
  // MP oculta los IDs en cobros pero incluye el objeto payer del cliente que pagó.
  // El sub_unit en estos casos refleja la perspectiva del pagador, no la nuestra.
  if (payerId === 0 && collectorId === 0 && payerObjExists) {
    result = false; reason = "payer_id=0 & collector=0 & payerObj=true → cobro recibido";
  }
  // Cuando los IDs están poblados y payer_id = mi ID → yo pagué (GASTO)
  else if (myId && payerId === myId && collectorId !== myId) {
    result = true; reason = `payer_id=${payerId}===myId → gasto`;
  }
  // Cuando los IDs están poblados y collector = mi ID → me pagaron (INGRESO)
  else if (myId && collectorId === myId && payerId !== myId) {
    result = false; reason = `collector.id=${collectorId}===myId → ingreso`;
  }
  // Sub_unit solo cuando los IDs son confiables
  else if (subUnit.includes("outflow")) {
    result = true; reason = `subUnit=${subUnit}`;
  } else if (subUnit.includes("inflow")) {
    result = false; reason = `subUnit=${subUnit}`;
  }
  // Tipos de operación
  else if (opType === "investment_income" || opType === "regular_payment") {
    result = false; reason = `opType=${opType}`;
  }
  // Fallback
  else {
    result = true; reason = "fallback → expense";
  }

  return result;
}

// Extrae nombre de un objeto payer/collector de MP
function extractPersonName(obj: Record<string, unknown> | undefined | null): string | null {
  if (!obj) return null;
  const first = String(obj.first_name ?? "").trim();
  const last = String(obj.last_name ?? "").trim();
  const nickname = String(obj.nickname ?? "").trim();
  const full = [first, last].filter(Boolean).join(" ");
  if (full) return full;
  if (nickname) return nickname;
  return null;
}

// Construye la mejor descripción posible con los campos disponibles
function buildDescription(p: Record<string, unknown>, isExpense: boolean): string {
  const poi = p.point_of_interaction as Record<string, unknown> | undefined;
  const bizInfo = poi?.business_info as Record<string, unknown> | undefined;
  const txData = (poi?.transaction_data as Record<string, unknown> | undefined);
  const bankInfo = txData?.bank_info as Record<string, unknown> | undefined;
  const opType = String(p.operation_type ?? "").toLowerCase();
  const payType = String(p.payment_type_id ?? "").toLowerCase();

  // 1. Nombre del comercio (QR / POS)
  const bizName = String(bizInfo?.name ?? "").trim();
  if (bizName && bizName !== "Varios" && bizName.length > 2) return bizName;

  // 2. statement_descriptor
  const stmt = String(p.statement_descriptor ?? "").trim();
  if (stmt && stmt !== "Varios" && stmt.length > 2) return stmt;

  // 3. Para ingresos: nombre de quien me pagó (payer)
  if (!isExpense) {
    // Desde el detalle completo del pago
    const payerName = extractPersonName(p.payer as Record<string, unknown> | undefined);
    if (payerName) return payerName;
    // Desde bank_info (transferencias bancarias)
    const bankPayerName = String((bankInfo?.payer as Record<string, unknown>)?.long_name ?? "").trim();
    if (bankPayerName && bankPayerName.length > 2) return bankPayerName;
  }

  // 4. Para gastos: nombre de quien cobró (collector)
  if (isExpense) {
    const collectorName = extractPersonName(p.collector as Record<string, unknown> | undefined);
    if (collectorName) return collectorName;
    const bankCollectorName = String((bankInfo?.collector as Record<string, unknown>)?.account_holder_name ?? "").trim();
    if (bankCollectorName && bankCollectorName.length > 2) return bankCollectorName;
  }

  // 5. description / reason
  const desc = String(p.description ?? "").trim();
  if (desc && desc !== "Varios" && desc.length > 2) return desc;

  // 6. Fallbacks descriptivos
  if (payType === "debit_card") return isExpense ? "Pago con débito" : "Cobro con débito";
  if (payType === "credit_card") return isExpense ? "Pago con crédito" : "Cobro con crédito";
  if (opType === "money_transfer") {
    return isExpense ? "Transferencia enviada" : "Transferencia recibida";
  }
  if (opType === "regular_payment") return isExpense ? "Pago QR" : "Cobro";

  return isExpense ? "Pago Mercado Pago" : "Cobro Mercado Pago";
}

function inferCategory(description: string, isExpense: boolean): string {
  if (!isExpense) {
    if (/club|equipo|liga|racing|universitario|atletico|deportivo|futbol|basquet|hockey|rugby/i.test(description)) {
      return "Fotografía";
    }
    return "Otro";
  }
  const d = description.toLowerCase();
  if (/netflix|spotify|disney|amazon|prime|hbo|apple|suscri/i.test(d)) return "Suscripciones";
  if (/pizza|burger|mcdonald|rappi|pedidos|delivery|restaurant|cafe|sushi|empanada|panaderia|almacen|verduleria|carniceria|super|mercado|carrefour|jumbo|dia\b|coto/i.test(d)) return "Alimentación";
  if (/uber|cabify|taxi|sube|colectivo|tren|subte|nafta|combustible|ypf|axion|shell/i.test(d)) return "Transporte";
  if (/farmacia|medico|doctor|salud|clinica|hospital/i.test(d)) return "Salud";
  if (/ropa|vestimenta|zapatilla|zara|adidas|nike/i.test(d)) return "Ropa";
  if (/luz|gas|agua|internet|telefon|edesur|edenor|metrogas|personal|claro|movistar/i.test(d)) return "Servicios";
  return "Otro";
}

export async function fetchMPTransactions(daysBack = 30): Promise<MPImportedTransaction[]> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - daysBack);
  const begin = dateFrom.toISOString().slice(0, 19) + ".000-03:00";
  const end = new Date().toISOString().slice(0, 19) + ".000-03:00";

  const [myIdFromApi, data] = await Promise.all([
    getMyUserId(),
    mpGet(
      `/v1/payments/search?sort=date_created&criteria=desc&limit=100&range=date_created&begin_date=${encodeURIComponent(begin)}&end_date=${encodeURIComponent(end)}`
    ) as Promise<{ results?: unknown[] }>,
  ]);

  const results = (data.results ?? []) as Record<string, unknown>[];

  // Si /v1/users/me falló, infiero mi ID desde los pagos salientes de los resultados
  const myId = myIdFromApi ?? inferMyIdFromResults(results);

  const txs: MPImportedTransaction[] = [];

  for (const p of results) {
    if (String(p.status) !== "approved") continue;
    const amount = Number(p.transaction_amount ?? 0);
    if (amount <= 0) continue;
    const date = String(p.date_created ?? "").slice(0, 10);
    if (date.length < 10) continue;

    const currency: "ARS" | "USD" = String(p.currency_id) === "USD" ? "USD" : "ARS";
    const isExpense = isExpensePayment(p, myId);
    const description = buildDescription(p, isExpense);
    const category = inferCategory(description, isExpense);

    txs.push({
      date,
      type: isExpense ? "EXPENSE" : "INCOME",
      amount,
      currency,
      category,
      description,
      source: "PERSONAL",
      mpId: String(p.id ?? ""),
    });
  }

  return txs.sort((a, b) => b.date.localeCompare(a.date));
}
