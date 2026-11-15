import {
    IVacanteRepository,
    FiltrosVacantes,
    ResultadoVacantes,
} from "../../../domain/vacantes/repositories/IVacanteRepository";
import { Vacante } from "../../../domain/vacantes/entities/Vacante";
import { prisma } from "../../database/PrismaClient";
import { TEXTO_VACANTE_SQL, patronContiene } from "../busquedaSql";

// Shape cruda de una fila devuelta por Prisma (tanto por findMany como
// por el $queryRaw de la busqueda), para no repetir el mapeo.
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

        // Una sola consulta SQL para todos los casos. Cada filtro que llega
        // agrega una condicion al WHERE (todas unidas con AND). Los valores
        // van como parametros ($1, $2...), nunca pegados al texto del SQL.
        // Texto y ubicacion se comparan con sin_tildes() de los dos lados,
        // asi "Bogota" encuentra "Bogotá" y "disenador" encuentra "diseñador".
        const condiciones: string[] = [];
        const valores: unknown[] = [];

        function agregar(sql: string, valor: unknown) {
            valores.push(valor);
            condiciones.push(sql.replace("$N", `$${valores.length}`));
        }

        // Busqueda full-text real de Postgres (to_tsvector + plainto_tsquery)
        // sobre titulo, empresa y descripcion, usando el indice GIN.
        if (q && q.trim().length > 0) {
            agregar(`${TEXTO_VACANTE_SQL} @@ plainto_tsquery('spanish', sin_tildes($N))`, q.trim());
        }
        if (ubicacion && ubicacion.trim().length > 0) {
            agregar(`sin_tildes(ubicacion) LIKE sin_tildes($N)`, patronContiene(ubicacion));
        }
        if (modalidad) agregar(`modalidad = $N`, modalidad);
        if (nivelExperiencia) agregar(`"nivelExperiencia" = $N`, nivelExperiencia);
        if (salarioMin !== undefined) agregar(`"salarioMin" >= $N`, salarioMin);
        if (salarioMax !== undefined) agregar(`"salarioMax" <= $N`, salarioMax);

        const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

        const filas = await prisma.$queryRawUnsafe<FilaVacante[]>(
            `SELECT * FROM vacantes ${where} ORDER BY "fechaPublicacion" DESC NULLS LAST, id LIMIT ${Number(limite)} OFFSET ${Number(offset)}`,
            ...valores
        );
        const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*)::bigint AS count FROM vacantes ${where}`,
            ...valores
        );

        return { vacantes: filas.map(aEntidad), total: Number(count) };
    }

    async obtenerPorId(id: string): Promise<Vacante | null> {
        const fila = await prisma.vacante.findUnique({ where: { id } });
        return fila ? aEntidad(fila) : null;
    }
}
