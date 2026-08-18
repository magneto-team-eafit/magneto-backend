import {
    IVacanteRepository,
    FiltrosVacantes,
    ResultadoVacantes,
} from "../../../domain/vacantes/repositories/IVacanteRepository";
import { Vacante } from "../../../domain/vacantes/entities/Vacante";
import { prisma } from "../../database/PrismaClient";

export class PrismaVacanteRepository implements IVacanteRepository {
    async listar(filtros: FiltrosVacantes): Promise<ResultadoVacantes> {
        const { ubicacion, modalidad, pagina, limite } = filtros;

        // Armamos el WHERE de forma dinamica: un filtro solo se agrega
        // si realmente vino en la query. Si ubicacion/modalidad vienen
        // undefined, el spread no agrega nada y Prisma trae todo.
        const where = {
            ...(ubicacion && {
                ubicacion: { contains: ubicacion, mode: "insensitive" as const },
            }),
            ...(modalidad && { modalidad }),
        };

        // findMany y count en paralelo: son dos queries independientes,
        // no hay razon para esperar una antes de lanzar la otra.
        const [filas, total] = await Promise.all([
            prisma.vacante.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { fechaPublicacion: "desc" },
            }),
            prisma.vacante.count({ where }),
        ]);

        const vacantes = filas.map((fila) =>
            Vacante.reconstruir({
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
            })
        );

        return { vacantes, total };
    }
}