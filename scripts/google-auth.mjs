/**
 * Script para obtener el refresh_token de Google Calendar + Drive.
 *
 * Uso:
 *   1. Completá GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env
 *   2. node scripts/google-auth.mjs
 *   3. Abrí la URL que aparece en el browser
 *   4. Autorizá el acceso y copiá el código de la URL de redirect
 *   5. Pegalo en la terminal cuando te lo pida
 *   6. Copiá el refresh_token que aparece en .env
 */

import { google } from "googleapis";
import { config } from "dotenv";
import readline from "readline";

config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env");
  process.exit(1);
}

const REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/drive",
];

const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

const url = auth.generateAuthUrl({ access_type: "offline", scope: SCOPES, prompt: "consent" });

console.log("\n=== Google Calendar + Drive Auth ===");
console.log("\nAbrí esta URL en el browser:\n");
console.log(url);
console.log("\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Pegá el código de autorización: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await auth.getToken(code.trim());
    console.log("\n✅ refresh_token obtenido:");
    console.log(`\nGOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"\n`);
    console.log("Copiá esto a tu archivo .env\n");
  } catch (err) {
    console.error("Error al obtener tokens:", err.message);
  }
});
