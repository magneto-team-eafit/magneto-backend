// Configuracion del servidor. Lee las variables de entorno una sola vez,
// las valida y falla de inmediato con un mensaje claro si falta alguna.
// Asi el servidor nunca arranca con secretos vacios.

import "dotenv/config";

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor || valor.trim() === "") {
    console.error(`[config] Falta la variable ${nombre}. Revisa tu archivo .env (ver .env.example).`);
    process.exit(1);
  }
  return valor.trim();
}

const jwtSecret = requerida("JWT_SECRET");
if (jwtSecret.length < 32) {
  console.warn("[config] JWT_SECRET tiene menos de 32 caracteres. Usa un valor largo y aleatorio (ver .env.example).");
}

export const env = {
  databaseUrl: requerida("DATABASE_URL"),
  jwtSecret,
  puerto: Number(process.env.PORT) || 4000,
  produccion: process.env.NODE_ENV === "production",
};