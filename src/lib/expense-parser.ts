import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXPENSE_CATEGORIES = [
  "Alimentación", "Transporte", "Entretenimiento", "Salud",
  "Servicios", "Ropa", "Educación", "Suscripciones", "Otro",
];
const INCOME_CATEGORIES = [
  "Sueldo", "Freelance", "Fotografía", "Venta", "Inversión",
  "Transferencia recibida", "Reembolso", "Otro",
];

export interface ParsedTransaction {
  type: "EXPENSE" | "INCOME";
  amount: number;
  currency: "ARS" | "USD";
  description: string;
  category: string;
}

export async function parseTransaction(text: string): Promise<ParsedTransaction | null> {
  const prompt = `Sos un asistente financiero. Analizá este mensaje y extraé la información de un gasto o ingreso.

Mensaje: "${text}"

Devolvé ÚNICAMENTE un JSON válido con esta estructura, sin texto adicional:
{
  "type": "EXPENSE" o "INCOME",
  "amount": número positivo,
  "currency": "ARS" o "USD" (ARS por defecto si no se especifica, USD si dice "dólares", "usd", "verdes", "cables"),
  "description": "sustantivo o nombre del ítem, sin verbos ni contexto (ej: 'Fotos al Farsa', 'Netflix', 'Supermercado', 'Sueldo marzo')",
  "category": una de estas categorías según el tipo:
    - Si es EXPENSE: ${EXPENSE_CATEGORIES.join(", ")}
    - Si es INCOME: ${INCOME_CATEGORIES.join(", ")}
}

Reglas:
- Si dice "gasté", "gaste", "compré", "compre", "pagué", "pague", "salí" → EXPENSE
- Si dice "cobré", "cobre", "me pagaron", "ingresó", "ingreso", "recibí", "recibi", "vendí", "vendi" → INCOME
- Si el monto tiene "k" (ej: "50k") multiplicá por 1000
- Ignorá símbolos como "$" en el monto, solo extraé el número
- Si no se especifica moneda, asumí ARS
- Ante la duda sobre el tipo, preferí EXPENSE
- Siempre devolvé un JSON válido, nunca null

Reglas para la descripción:
- Usá solo el sustantivo o nombre del ítem, sin verbos ("gasté", "cobré", "me pagaron", "pagué")
- Sin frases como "Pago por", "Cobro de", "Ingreso por" — el tipo ya indica si es gasto o ingreso
- Máximo 4 palabras, al punto

Ejemplos:
- "gasté 5000 en el super" → {"type":"EXPENSE","amount":5000,"currency":"ARS","description":"Supermercado","category":"Alimentación"}
- "cobré 150k de sueldo" → {"type":"INCOME","amount":150000,"currency":"ARS","description":"Sueldo marzo","category":"Sueldo"}
- "pagué 20 usd de netflix" → {"type":"EXPENSE","amount":20,"currency":"USD","description":"Netflix","category":"Suscripciones"}
- "me pagaron 50000 de fotos al Farsa" → {"type":"INCOME","amount":50000,"currency":"ARS","description":"Fotos al Farsa","category":"Fotografía"}
- "gasté 3000 en uber" → {"type":"EXPENSE","amount":3000,"currency":"ARS","description":"Uber","category":"Transporte"}
- "compré ropa por 15000" → {"type":"EXPENSE","amount":15000,"currency":"ARS","description":"Ropa","category":"Ropa"}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  console.log(`[Parser] Raw response:`, raw);

  // Extraer JSON si viene envuelto en ```json ... ```
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
  const jsonStr = (jsonMatch[1] ?? raw).trim();

  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.type || !parsed.amount || !parsed.currency || !parsed.description || !parsed.category) {
      return null;
    }
    return parsed as ParsedTransaction;
  } catch {
    return null;
  }
}
