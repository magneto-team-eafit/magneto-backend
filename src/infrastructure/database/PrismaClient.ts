// dotenv/config se importa aqui mismo (no solo en server.ts) porque
// este archivo necesita leer DATABASE_URL apenas se carga, y los imports
// de TypeScript se ejecutan ANTES que el resto del codigo de server.ts,
// incluyendo el dotenv.config() que ya tenias ahi.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Una sola instancia de PrismaClient para toda la aplicacion.
export const prisma = new PrismaClient({ adapter });