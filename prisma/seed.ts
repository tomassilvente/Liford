import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

async function main() {
  console.log("Seeding users...");

  const tomasHash = await bcrypt.hash(process.env.TOMAS_PASSWORD ?? "liford2024", 12);
  const demoHash = await bcrypt.hash("demo1234", 12);

  await db.user.update({
    where: { id: "user_tomas" },
    data: { username: "tomas", passwordHash: tomasHash, displayName: "Tomas" },
  });
  console.log("✓ Usuario tomas actualizado");

  const demoUser = await db.user.upsert({
    where: { username: "demo" },
    update: { passwordHash: demoHash },
    create: {
      id: "user_demo",
      username: "demo",
      passwordHash: demoHash,
      displayName: "Demo",
    },
  });
  console.log("✓ Usuario demo:", demoUser.id);

  // Wipe and rebuild demo data
  console.log("Limpiando datos demo anteriores...");
  await db.transaction.deleteMany({ where: { userId: demoUser.id } });
  await db.investment.deleteMany({ where: { userId: demoUser.id } });
  await db.wallet.deleteMany({ where: { userId: demoUser.id } });

  console.log("Creando datos demo...");

  // ── Billeteras ────────────────────────────────────────────────────────────
  await db.wallet.createMany({
    data: [
      { userId: demoUser.id, name: "Mercado Pago", currency: "ARS", balance: 61200 },
      { userId: demoUser.id, name: "Brubank",      currency: "ARS", balance: 24500 },
      { userId: demoUser.id, name: "Wise",         currency: "USD", balance: 420  },
    ],
  });
  console.log("✓ Billeteras creadas");

  // ── Inversiones ───────────────────────────────────────────────────────────
  await db.investment.createMany({
    data: [
      { userId: demoUser.id, ticker: "AAPL",  name: "Apple Inc.",       type: "STOCK",  quantity: 3,     avgBuyPrice: 181.50 },
      { userId: demoUser.id, ticker: "NVDA",  name: "NVIDIA Corp.",     type: "STOCK",  quantity: 2,     avgBuyPrice: 492.00 },
      { userId: demoUser.id, ticker: "AMZN",  name: "Amazon.com Inc.",  type: "STOCK",  quantity: 1,     avgBuyPrice: 178.00 },
      { userId: demoUser.id, ticker: "BTC",   name: "Bitcoin",          type: "CRYPTO", quantity: 0.018, avgBuyPrice: 41500  },
      { userId: demoUser.id, ticker: "ETH",   name: "Ethereum",         type: "CRYPTO", quantity: 0.25,  avgBuyPrice: 2200   },
    ],
  });
  console.log("✓ Inversiones creadas");

  // ── Transacciones ─────────────────────────────────────────────────────────
  await db.transaction.createMany({
    data: [
      // ── Enero 2026 ────────────────────────────────────────────────────────
      { userId: demoUser.id, type: "INCOME",  currency: "ARS", amount: 320000, category: "Sueldo",         description: "Sueldo enero",            source: "PERSONAL", date: d(2026, 1, 2)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 95000,  category: "Servicios",      description: "Alquiler enero",          source: "PERSONAL", date: d(2026, 1, 3)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 13400,  category: "Alimentación",   description: "Supermercado Disco",      source: "PERSONAL", date: d(2026, 1, 7)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 3200,   category: "Transporte",     description: "SUBE + Uber",             source: "PERSONAL", date: d(2026, 1, 10) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 9800,   category: "Alimentación",   description: "Verdulería + carnicería", source: "PERSONAL", date: d(2026, 1, 14) },
      { userId: demoUser.id, type: "EXPENSE", currency: "USD", amount: 22,     category: "Suscripciones",  description: "Netflix + Spotify",       source: "PERSONAL", date: d(2026, 1, 15) },
      { userId: demoUser.id, type: "INCOME",  currency: "USD", amount: 120,    category: "Freelance",      description: "Proyecto landing page",   source: "PERSONAL", date: d(2026, 1, 18) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 16800,  category: "Entretenimiento",description: "Salida + restaurant",     source: "PERSONAL", date: d(2026, 1, 20) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 4500,   category: "Salud",          description: "Farmacia",                source: "PERSONAL", date: d(2026, 1, 24) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 11200,  category: "Servicios",      description: "Internet + luz",          source: "PERSONAL", date: d(2026, 1, 28) },

      // ── Febrero 2026 ──────────────────────────────────────────────────────
      { userId: demoUser.id, type: "INCOME",  currency: "ARS", amount: 320000, category: "Sueldo",         description: "Sueldo febrero",          source: "PERSONAL", date: d(2026, 2, 3)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 95000,  category: "Servicios",      description: "Alquiler febrero",        source: "PERSONAL", date: d(2026, 2, 4)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 11800,  category: "Alimentación",   description: "Supermercado Carrefour",  source: "PERSONAL", date: d(2026, 2, 8)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 22500,  category: "Ropa",           description: "Zapatillas + remeras",    source: "PERSONAL", date: d(2026, 2, 11) },
      { userId: demoUser.id, type: "EXPENSE", currency: "USD", amount: 22,     category: "Suscripciones",  description: "Netflix + Spotify",       source: "PERSONAL", date: d(2026, 2, 15) },
      { userId: demoUser.id, type: "INCOME",  currency: "USD", amount: 200,    category: "Freelance",      description: "Diseño web cliente",      source: "PERSONAL", date: d(2026, 2, 17) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 7600,   category: "Entretenimiento",description: "Cine + helados",          source: "PERSONAL", date: d(2026, 2, 22) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 14300,  category: "Servicios",      description: "Internet + luz + gas",    source: "PERSONAL", date: d(2026, 2, 25) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 8900,   category: "Alimentación",   description: "Mercado semanal",         source: "PERSONAL", date: d(2026, 2, 27) },

      // ── Marzo 2026 ────────────────────────────────────────────────────────
      { userId: demoUser.id, type: "INCOME",  currency: "ARS", amount: 355000, category: "Sueldo",         description: "Sueldo marzo (aumento)",  source: "PERSONAL", date: d(2026, 3, 3)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 95000,  category: "Servicios",      description: "Alquiler marzo",          source: "PERSONAL", date: d(2026, 3, 4)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 14200,  category: "Alimentación",   description: "Supermercado Día",        source: "PERSONAL", date: d(2026, 3, 7)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 35000,  category: "Educación",      description: "Curso de diseño UX",      source: "PERSONAL", date: d(2026, 3, 10) },
      { userId: demoUser.id, type: "EXPENSE", currency: "USD", amount: 22,     category: "Suscripciones",  description: "Netflix + Spotify",       source: "PERSONAL", date: d(2026, 3, 15) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 4100,   category: "Transporte",     description: "Nafta + peajes",          source: "PERSONAL", date: d(2026, 3, 17) },
      { userId: demoUser.id, type: "INCOME",  currency: "USD", amount: 150,    category: "Freelance",      description: "Mantenimiento web",       source: "PERSONAL", date: d(2026, 3, 19) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 9800,   category: "Alimentación",   description: "Feria + verdulería",      source: "PERSONAL", date: d(2026, 3, 22) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 13800,  category: "Servicios",      description: "Internet + luz",          source: "PERSONAL", date: d(2026, 3, 26) },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 18400,  category: "Entretenimiento",description: "Viaje de fin de semana",  source: "PERSONAL", date: d(2026, 3, 29) },

      // ── Abril 2026 (mes actual, parcial) ──────────────────────────────────
      { userId: demoUser.id, type: "INCOME",  currency: "ARS", amount: 355000, category: "Sueldo",         description: "Sueldo abril",            source: "PERSONAL", date: d(2026, 4, 1)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 95000,  category: "Servicios",      description: "Alquiler abril",          source: "PERSONAL", date: d(2026, 4, 2)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "ARS", amount: 10500,  category: "Alimentación",   description: "Supermercado",            source: "PERSONAL", date: d(2026, 4, 6)  },
      { userId: demoUser.id, type: "EXPENSE", currency: "USD", amount: 22,     category: "Suscripciones",  description: "Netflix + Spotify",       source: "PERSONAL", date: d(2026, 4, 10) },
    ],
  });
  console.log("✓ Transacciones creadas");

  console.log("Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
