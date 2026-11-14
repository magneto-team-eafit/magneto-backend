import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/PrismaClient";

const LIMITE_POR_TEXTO = 200;
const LIMITE_POR_CIUDAD = 100;

// Trae solo las vacantes que vale la pena puntuar, en vez de revisar las
// ~3000 una por una. Dos fuentes, unidas:
//  1) las mas parecidas por texto (indice GIN full-text, ordenadas con ts_rank)
//  2) las de la ciudad del usuario
// Se excluyen las que la persona ya descarto. (SQL: UNION de dos SELECT con
// NOT EXISTS para el filtro.)
export async function buscarVacantesCandidatas(params: {
  usuarioId: string;
  consultaTexto: string;
  ubicacion?: string | null;
}) {
  const { usuarioId, consultaTexto, ubicacion } = params;
  const ids = new Set<string>();

  const noDescartada = Prisma.sql`NOT EXISTS (
    SELECT 1 FROM postulaciones p
    WHERE p."vacanteId" = v.id AND p."usuarioId" = ${usuarioId} AND p.estado = 'DESCARTADO'
  )`;

  const terminos = consultaTexto.split(" ").filter(Boolean);
  if (terminos.length > 0) {
    // Los terminos ya vienen limpios (solo letras y numeros): se unen con OR.
    const tsquery = terminos.join(" | ");
    // La expresion de to_tsvector es la misma del indice GIN, para que lo use.
    const filas = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT v.id
      FROM vacantes v
      WHERE to_tsvector('spanish', v.titulo || ' ' || v.empresa || ' ' || v.descripcion)
            @@ to_tsquery('spanish', ${tsquery})
        AND ${noDescartada}
      ORDER BY ts_rank(
        to_tsvector('spanish', v.titulo || ' ' || v.empresa || ' ' || v.descripcion),
        to_tsquery('spanish', ${tsquery})
      ) DESC
      LIMIT ${LIMITE_POR_TEXTO}
    `);
    filas.forEach((f) => ids.add(f.id));
  }

  const ciudad = ubicacion?.split(",")[0]?.trim();
  if (ciudad && ciudad !== "0") {
    const filas = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT v.id
      FROM vacantes v
      WHERE v.ubicacion ILIKE ${"%" + ciudad + "%"}
        AND ${noDescartada}
      LIMIT ${LIMITE_POR_CIUDAD}
    `);
    filas.forEach((f) => ids.add(f.id));
  }

  if (ids.size === 0) return [];
  return prisma.vacante.findMany({ where: { id: { in: [...ids] } } });
}

// Para cada palabra, que fraccion de TODAS las vacantes la contiene (0 a 1).
// Sirve para que las palabras muy comunes ("general", "analista") valgan poco.
// (SQL: un COUNT(*) con filtro por palabra, dividido entre el total de filas;
// usa el mismo indice GIN de la busqueda.)
export async function calcularFrecuenciasPalabras(palabras: string[]): Promise<Map<string, number>> {
  const frecuencias = new Map<string, number>();
  if (palabras.length === 0) return frecuencias;

  const total = await prisma.vacante.count();
  if (total === 0) return frecuencias;

  await Promise.all(
    palabras.map(async (palabra) => {
      // La palabra ya viene limpia (solo letras y numeros).
      const [fila] = await prisma.$queryRaw<{ cantidad: bigint }[]>(Prisma.sql`
        SELECT COUNT(*) AS cantidad
        FROM vacantes v
        WHERE to_tsvector('spanish', v.titulo || ' ' || v.empresa || ' ' || v.descripcion)
              @@ plainto_tsquery('spanish', ${palabra})
      `);
      frecuencias.set(palabra, Number(fila.cantidad) / total);
    }),
  );
  return frecuencias;
}
