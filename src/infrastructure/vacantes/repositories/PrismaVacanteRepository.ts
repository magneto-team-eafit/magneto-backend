import {
    IVacanteRepository,
    FiltrosVacantes,
    ResultadoVacantes,
} from "../../../domain/vacantes/repositories/IVacanteRepository";
import { Vacante } from "../../../domain/vacantes/entities/Vacante";
import { prisma } from "../../database/PrismaClient";

// Shape cruda de una fila devuelta por Prisma (tanto por findMany como
// por el $queryRaw de busqueda full-text), para no repetir el mapeo.
interface FilaVacante {
    id: string;
    titulo: string;
    empresa: string;
    ubicacion: string | null;
    modalidad: string | null;
    nivelExperiencia: string | null;
    salarioMin: number | null;
    salarioMax: number | null;
    moneda: string | null;
    descripcion: string;
    urlOriginal: string | null;
    fuente: string;
    fechaPublicacion: Date | null;
}

function aEntidad(fila: FilaVacante): Vacante {
    return Vacante.reconstruir({
        id: fila.id,
        titulo: fila.titulo,
        empresa: fila.empresa,
        ubicacion: fila.ubicacion,
        modalidad: fila.modalidad,
        nivelExperiencia: fila.nivelExperiencia,
        salarioMin: fila.salarioMin,
        salarioMax: fila.salarioMax,
        moneda: fila.moneda,
        descripcion: fila.descripcion,
        urlOriginal: fila.urlOriginal,
        fuente: fila.fuente,
        fechaPublicacion: fila.fechaPublicacion,
    });
}

export class PrismaVacanteRepository implements IVacanteRepository {
    async listar(filtros: FiltrosVacantes): Promise<ResultadoVacantes> {
        const { ubicacion, modalidad, nivelExperiencia, salarioMin, salarioMax, q, pagina, limite } = filtros;
        const offset = (pagina - 1) * limite;

        // Camino 1: hay texto de busqueda -> usamos busqueda full-text real
        // de Postgres (to_tsvector + plainto_tsquery) sobre titulo, empresa
        // y descripcion, en vez de un LIKE simple. Esto es lo que el reto
        // de Entrega 2 pide como "busqueda full-text".
        if (q && q.trim().length > 0) {
            const condiciones: string[] = [
                `to_tsvector('spanish', titulo || ' ' || empresa || ' ' || descripcion) @@ plainto_tsquery('spanish', $1)`,
            ];
            const valores: unknown[] = [q.trim()];

            function agregarCondicion(sql: string, valor: unknown) {
                valores.push(valor);
                condiciones.push(sql.replace("$N", `$${valores.length}`));
            }

            if (ubicacion) agregarCondicion(`ubicacion ILIKE $N`, `%${ubicacion}%`);
            if (modalidad) agregarCondicion(`modalidad = $N`, modalidad);
            if (nivelExperiencia) agregarCondicion(`"nivelExperiencia" = $N`, nivelExperiencia);
            if (salarioMin !== undefined) agregarCondicion(`"salarioMin" >= $N`, salarioMin);
            if (salarioMax !== undefined) agregarCondicion(`"salarioMax" <= $N`, salarioMax);

            const where = condiciones.join(" AND ");

            const filas = await prisma.$queryRawUnsafe<FilaVacante[]>(
                `SELECT * FROM vacantes WHERE ${where} ORDER BY "fechaPublicacion" DESC NULLS LAST LIMIT ${limite} OFFSET ${offset}`,
                ...valores
            );
            const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
                `SELECT COUNT(*)::bigint AS count FROM vacantes WHERE ${where}`,
                ...valores
            );

            return { vacantes: filas.map(aEntidad), total: Number(count) };
        }

        // Camino 2: sin texto de busqueda -> query normal de Prisma,
        // mas simple y mas facil de mantener que raw SQL cuando no
        // hace falta full-text.
        const where = {
            ...(ubicacion && { ubicacion: { contains: ubicacion, mode: "insensitive" as const } }),
            ...(modalidad && { modalidad }),
            ...(nivelExperiencia && { nivelExperiencia }),
            ...((salarioMin !== undefined || salarioMax !== undefined) && {
                ...(salarioMin !== undefined && { salarioMin: { gte: salarioMin } }),
                ...(salarioMax !== undefined && { salarioMax: { lte: salarioMax } }),
            }),
        };

        const [filas, total] = await Promise.all([
            prisma.vacante.findMany({
                where,
                skip: offset,
                take: limite,
                orderBy: { fechaPublicacion: "desc" },
            }),
            prisma.vacante.count({ where }),
        ]);

        return { vacantes: filas.map(aEntidad), total };
    }

    async obtenerPorId(id: string): Promise<Vacante | null> {
        const fila = await prisma.vacante.findUnique({ where: { id } });
        return fila ? aEntidad(fila) : null;
    }
}
