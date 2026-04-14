import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { parseTransaction } from "@/lib/expense-parser";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";

// ── Enviar mensaje por Meta WhatsApp Cloud API ───────────────────────────────
async function sendWhatsAppMessage(to: string, text: string) {
  const res = await fetch(
    `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );
  const json = await res.json();
  console.log(`[WhatsApp] sendMessage status: ${res.status}`, JSON.stringify(json));
}

// ── Descargar y transcribir audio via Groq Whisper ───────────────────────────
async function transcribeAudio(mediaId: string): Promise<string | null> {
  // 1. Obtener la URL del archivo de Meta
  const metaRes = await fetch(`https://graph.facebook.com/v25.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
  });
  if (!metaRes.ok) return null;
  const { url } = await metaRes.json();

  // 2. Descargar el audio
  const audioRes = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
  });
  if (!audioRes.ok) return null;
  const audioBuffer = await audioRes.arrayBuffer();

  // 3. Enviar a Groq Whisper
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer], { type: "audio/ogg" }), "audio.ogg");
  formData.append("model", "whisper-large-v3");
  formData.append("language", "es");

  const transcribeRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: formData,
  });
  if (!transcribeRes.ok) return null;

  const json = await transcribeRes.json();
  return json.text ?? null;
}

// ── GET: verificación del webhook por Meta ───────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ── POST: mensajes entrantes ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Extraer el mensaje del payload de Meta
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];

  // Ignorar notificaciones que no son mensajes (status updates, etc.)
  if (!message) return new Response("OK", { status: 200 });

  const from = message.from as string; // número del remitente
  const msgType = message.type as string;

  // Log para debuggear el número
  console.log(`[WhatsApp] Mensaje de: ${from} | Tipo: ${msgType}`);

  // Verificar número autorizado
  const authorizedNumber = process.env.WHATSAPP_AUTHORIZED_NUMBER?.replace(/\D/g, "");
  console.log(`[WhatsApp] Autorizado: ${authorizedNumber} | Recibido: ${from}`);
  if (authorizedNumber && from !== authorizedNumber) {
    console.log(`[WhatsApp] Número no autorizado, ignorando.`);
    return new Response("OK", { status: 200 });
  }

  let text = "";

  if (msgType === "text") {
    text = message.text?.body?.trim() ?? "";
  } else if (msgType === "audio") {
    const mediaId = message.audio?.id;
    if (!mediaId) {
      await sendWhatsAppMessage(from, "❌ No pude procesar el audio.");
      return new Response("OK", { status: 200 });
    }
    const transcription = await transcribeAudio(mediaId);
    if (!transcription) {
      await sendWhatsAppMessage(from, "❌ No pude transcribir el audio. Intentá mandarlo como texto.");
      return new Response("OK", { status: 200 });
    }
    text = transcription;
  } else {
    // Tipo de mensaje no soportado (imagen, sticker, etc.)
    await sendWhatsAppMessage(
      from,
      "Solo entiendo mensajes de texto y audios 🎤\n\nEjemplos:\n• _gasté 5000 en el super_\n• _cobré 150k de sueldo_"
    );
    return new Response("OK", { status: 200 });
  }

  if (!text) {
    await sendWhatsAppMessage(
      from,
      "Hola! Podés registrar gastos e ingresos así:\n\n• _gasté 5000 en el super_\n• _cobré 150k de sueldo_\n• _pagué 20 usd de netflix_\n\nTambién podés mandarme un audio 🎤"
    );
    return new Response("OK", { status: 200 });
  }

  // Parsear con Claude
  console.log(`[WhatsApp] Texto a parsear: "${text}"`);
  const parsed = await parseTransaction(text);
  console.log(`[WhatsApp] Parsed:`, parsed);

  if (!parsed) {
    await sendWhatsAppMessage(
      from,
      "❌ No pude entender el mensaje. Intentá:\n\n• _gasté 3500 en nafta_\n• _cobré 80000 de un freelance_\n• _pagué 15 usd de spotify_"
    );
    return new Response("OK", { status: 200 });
  }

  // Buscar billetera por moneda
  const whatsappUserId = process.env.WHATSAPP_USER_ID;
  const wallet = await db.wallet.findFirst({
    where: { currency: parsed.currency, ...(whatsappUserId && { userId: whatsappUserId }) },
    orderBy: { createdAt: "asc" },
  });
  console.log(`[WhatsApp] Billetera encontrada:`, wallet?.name ?? "ninguna");

  if (!wallet) {
    await sendWhatsAppMessage(
      from,
      `❌ No tenés ninguna billetera en ${parsed.currency}. Creá una en la app primero.`
    );
    return new Response("OK", { status: 200 });
  }

  // Guardar en DB
  await db.$transaction([
    db.transaction.create({
      data: {
        userId: wallet.userId,
        type: parsed.type === "EXPENSE" ? TransactionType.EXPENSE : TransactionType.INCOME,
        source: TransactionSource.PERSONAL,
        amount: parsed.amount,
        currency: parsed.currency,
        category: parsed.category,
        description: parsed.description,
        date: new Date(),
      },
    }),
    db.wallet.update({
      where: { id: wallet.id },
      data: {
        balance:
          parsed.type === "EXPENSE"
            ? { decrement: parsed.amount }
            : { increment: parsed.amount },
      },
    }),
  ]);

  const emoji = parsed.type === "EXPENSE" ? "📉" : "📈";
  const verb = parsed.type === "EXPENSE" ? "Gasto" : "Ingreso";
  const sign = parsed.type === "EXPENSE" ? "-" : "+";
  const amountStr =
    parsed.currency === "ARS"
      ? `$${parsed.amount.toLocaleString("es-AR")} ARS`
      : `$${parsed.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`;

  await sendWhatsAppMessage(
    from,
    `${emoji} *${verb} registrado*\n\n📝 ${parsed.description}\n💰 ${sign}${amountStr}\n🏷️ ${parsed.category}\n🏦 ${wallet.name}`
  );

  return new Response("OK", { status: 200 });
}
