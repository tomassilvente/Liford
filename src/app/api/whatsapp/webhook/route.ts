import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { parseTransaction } from "@/lib/expense-parser";
import { TransactionType, TransactionSource, SessionStatus } from "@/generated/prisma/enums";

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
  const metaRes = await fetch(`https://graph.facebook.com/v25.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
  });
  if (!metaRes.ok) return null;
  const { url } = await metaRes.json();

  const audioRes = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
  });
  if (!audioRes.ok) return null;
  const audioBuffer = await audioRes.arrayBuffer();

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

// ── Inferir tipo de sesión desde la descripción ───────────────────────────────
function inferSessionType(description: string): "SPORT" | "EVENT" | "OTHER" {
  const d = description.toLowerCase();
  if (/f[uú]tbol|partido|liga|básquet|basquet|hockey|rugby|tenis|padel|deporte/.test(d)) return "SPORT";
  if (/evento|casamiento|cumplea|fiesta|media.?day/.test(d)) return "EVENT";
  return "OTHER";
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

  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];

  if (!message) return new Response("OK", { status: 200 });

  const from = message.from as string;
  const msgType = message.type as string;

  console.log(`[WhatsApp] Mensaje de: ${from} | Tipo: ${msgType}`);

  const authorizedNumber = process.env.WHATSAPP_AUTHORIZED_NUMBER?.replace(/\D/g, "");
  if (authorizedNumber && from !== authorizedNumber) {
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
    await sendWhatsAppMessage(
      from,
      "Solo entiendo mensajes de texto y audios 🎤\n\nEjemplos:\n• _gasté 5000 en el super_\n• _cobré 150k de sueldo_\n• _cobré 50000 de fotos al Racing_"
    );
    return new Response("OK", { status: 200 });
  }

  if (!text) {
    await sendWhatsAppMessage(
      from,
      "Hola! Podés registrar gastos e ingresos así:\n\n• _gasté 5000 en el super_\n• _cobré 150k de sueldo_\n• _cobré 50000 de fotos al Racing_\n\nTambién podés mandarme un audio 🎤"
    );
    return new Response("OK", { status: 200 });
  }

  console.log(`[WhatsApp] Texto a parsear: "${text}"`);
  const parsed = await parseTransaction(text);
  console.log(`[WhatsApp] Parsed:`, parsed);

  if (!parsed) {
    await sendWhatsAppMessage(
      from,
      "❌ No pude entender el mensaje. Intentá:\n\n• _gasté 3500 en nafta_\n• _cobré 80000 de un freelance_\n• _cobré 50k de fotos al Farsa_"
    );
    return new Response("OK", { status: 200 });
  }

  // Buscar usuario configurado
  const whatsappUsername = process.env.WHATSAPP_USERNAME;
  let botUserId: string | undefined;
  if (whatsappUsername) {
    const botUser = await db.user.findUnique({ where: { username: whatsappUsername } });
    if (!botUser) {
      await sendWhatsAppMessage(from, `❌ Usuario "${whatsappUsername}" no encontrado.`);
      return new Response("OK", { status: 200 });
    }
    botUserId = botUser.id;
  }

  // Buscar cuenta en la moneda correcta
  const wallet = await db.wallet.findFirst({
    where: { currency: parsed.currency, ...(botUserId && { userId: botUserId }) },
    orderBy: { createdAt: "asc" },
  });
  const foreignAccount = !wallet
    ? await db.foreignAccount.findFirst({
        where: { currency: parsed.currency, ...(botUserId && { userId: botUserId }) },
        orderBy: { createdAt: "asc" },
      })
    : null;

  const accountName = wallet?.name ?? foreignAccount?.name;
  const accountUserId = wallet?.userId ?? foreignAccount?.userId;

  if (!accountName || !accountUserId) {
    await sendWhatsAppMessage(
      from,
      `❌ No tenés ninguna cuenta en ${parsed.currency}. Creá una billetera o cuenta foránea en la app.`
    );
    return new Response("OK", { status: 200 });
  }

  const amountStr =
    parsed.currency === "ARS"
      ? `$${parsed.amount.toLocaleString("es-AR")} ARS`
      : `$${parsed.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`;

  // ── Flujo especial: ingreso de fotografía ─────────────────────────────────
  if (parsed.category === "Fotografía" && parsed.type === "INCOME") {
    // 1. Buscar o crear cliente con el nombre de la descripción
    let client = await db.client.findFirst({
      where: { userId: accountUserId, name: { equals: parsed.description, mode: "insensitive" } },
    });
    if (!client) {
      client = await db.client.create({
        data: { userId: accountUserId, name: parsed.description },
      });
    }

    // 2. Crear la sesión en estado PAID
    const sessionType = inferSessionType(text);
    const session = await db.session.create({
      data: {
        clientId: client.id,
        type: sessionType,
        date: new Date(),
        price: parsed.amount,
        currency: parsed.currency,
        status: SessionStatus.PAID,
        notes: `Registrado via WhatsApp: "${text}"`,
      },
    });

    // 3. Crear ingreso en finanzas con source=PHOTOGRAPHY + actualizar balance
    await db.$transaction([
      db.transaction.create({
        data: {
          userId: accountUserId,
          type: TransactionType.INCOME,
          source: TransactionSource.PHOTOGRAPHY,
          amount: parsed.amount,
          currency: parsed.currency,
          category: "Fotografía",
          description: parsed.description,
          date: new Date(),
          sessionId: session.id,
        },
      }),
      wallet
        ? db.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: parsed.amount } } })
        : db.foreignAccount.update({ where: { id: foreignAccount!.id }, data: { balance: { increment: parsed.amount } } }),
    ]);

    const typeLabel = sessionType === "SPORT" ? "Deporte" : sessionType === "EVENT" ? "Evento" : "Otro";

    await sendWhatsAppMessage(
      from,
      `📸 *Sesión de fotografía registrada*\n\n` +
      `👤 Cliente: ${client.name}\n` +
      `🏷️ Tipo: ${typeLabel}\n` +
      `💰 +${amountStr}\n` +
      `🏦 ${accountName}\n\n` +
      `✅ Aparece en el panel de Fotografía como *Pagada* y en Finanzas como ingreso.`
    );

    return new Response("OK", { status: 200 });
  }

  // ── Flujo normal: gasto o ingreso personal ────────────────────────────────
  await db.$transaction([
    db.transaction.create({
      data: {
        userId: accountUserId,
        type: parsed.type === "EXPENSE" ? TransactionType.EXPENSE : TransactionType.INCOME,
        source: TransactionSource.PERSONAL,
        amount: parsed.amount,
        currency: parsed.currency,
        category: parsed.category,
        description: parsed.description,
        date: new Date(),
      },
    }),
    wallet
      ? db.wallet.update({
          where: { id: wallet.id },
          data: { balance: parsed.type === "EXPENSE" ? { decrement: parsed.amount } : { increment: parsed.amount } },
        })
      : db.foreignAccount.update({
          where: { id: foreignAccount!.id },
          data: { balance: parsed.type === "EXPENSE" ? { decrement: parsed.amount } : { increment: parsed.amount } },
        }),
  ]);

  const emoji = parsed.type === "EXPENSE" ? "📉" : "📈";
  const verb = parsed.type === "EXPENSE" ? "Gasto" : "Ingreso";
  const sign = parsed.type === "EXPENSE" ? "-" : "+";

  await sendWhatsAppMessage(
    from,
    `${emoji} *${verb} registrado*\n\n📝 ${parsed.description}\n💰 ${sign}${amountStr}\n🏷️ ${parsed.category}\n🏦 ${accountName}`
  );

  return new Response("OK", { status: 200 });
}
