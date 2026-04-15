# Liford

Gestor de finanzas personales self-hosted. Registrá gastos, ingresos, inversiones y metas desde cualquier dispositivo — o directamente desde WhatsApp con texto o audio.

---

## Características

- **Dashboard** — resumen del mes, balance de billeteras, evolución del patrimonio
- **Gastos e ingresos** — con categorías, filtro por mes y edición inline
- **Billeteras** — en ARS con balance actualizado automáticamente
- **Cuentas foráneas** — para divisas extranjeras (USD, EUR, etc.)
- **Inversiones** — portfolio con cotización en tiempo real (acciones y crypto)
- **Presupuesto** — límites mensuales por categoría con barra de progreso
- **Recurrentes** — gastos e ingresos que se registran solos el día configurado
- **Metas de ahorro** — con barra de progreso vinculada a una cuenta
- **Importar / Exportar** — desde Excel, JSON o archivos `.mmbackup` (MyFinance); exporta a `.xlsx`
- **Quick Add** — botón flotante para registrar rápido desde cualquier pantalla
- **Bot de WhatsApp** — mandá un mensaje o un audio y se registra solo usando IA

---

## Stack

- [Next.js 16](https://nextjs.org) — App Router, server components
- [Prisma 7](https://www.prisma.io) + PostgreSQL ([Neon](https://neon.tech))
- [Tailwind CSS 4](https://tailwindcss.com)
- [Recharts](https://recharts.org) — gráficos
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) + JWT — autenticación
- [Claude API](https://anthropic.com) — parser de mensajes del bot
- [Groq Whisper](https://groq.com) — transcripción de audios del bot
- Meta WhatsApp Cloud API — integración del bot

---

## Deploy rápido

### 1. Base de datos (Neon)

Creá un proyecto en [neon.tech](https://neon.tech) y copiá el `DATABASE_URL`.

Desde tu máquina, corrí las migraciones:

```bash
DATABASE_URL="tu-url-de-neon" npx prisma migrate deploy
```

### 2. Variables de entorno

Copiá `.env.example` a `.env.local` y completá los valores:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de PostgreSQL (Neon) |
| `SESSION_SECRET` | String random de 32+ chars (`openssl rand -base64 32`) |
| `ANTHROPIC_API_KEY` | API key de Anthropic (para el bot) |
| `GROQ_API_KEY` | API key de Groq (transcripción de audios) |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número en Meta for Developers |
| `WHATSAPP_ACCESS_TOKEN` | Token de acceso de Meta |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificación del webhook (cualquier string) |
| `WHATSAPP_AUTHORIZED_NUMBER` | Tu número sin `+` ni espacios (ej: `5491112345678`) |
| `WHATSAPP_USERNAME` | Username de la cuenta que recibe las transacciones del bot |

### 3. Vercel

1. Importá el repo en [vercel.com](https://vercel.com)
2. Cargá las variables de entorno en el dashboard
3. Deploy — Vercel detecta Next.js automáticamente

### 4. Crear tu cuenta

Después del deploy, entrá a `/login` → **Crear cuenta**.

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editá .env con tu DATABASE_URL local y SESSION_SECRET

# Correr migraciones
npx prisma migrate dev

# Iniciar servidor
npm run dev
```

---

## Bot de WhatsApp

El bot acepta mensajes de texto y audios. Ejemplos:

```
gasté 5000 en el super
pagué 20 usd de netflix
cobré 150k de sueldo
```

El audio se transcribe con Groq Whisper y luego Claude lo interpreta para extraer monto, moneda, categoría y descripción. La transacción se registra automáticamente en la billetera correspondiente.

Para configurarlo necesitás una app en [Meta for Developers](https://developers.facebook.com) con WhatsApp Business API habilitado, apuntando el webhook a `https://tu-dominio.com/api/whatsapp/webhook`.

---

## Licencia

MIT
