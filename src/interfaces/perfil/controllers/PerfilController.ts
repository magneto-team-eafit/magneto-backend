import { Request, Response } from "express";
import { ObtenerPerfil } from "../../../application/perfil/useCases/ObtenerPerfil";
import { GuardarPasoPerfil, PASOS_PERFIL, PasoPerfil } from "../../../application/perfil/useCases/GuardarPasoPerfil";
import { PrismaPerfilRepository } from "../../../infrastructure/perfil/repositories/PrismaPerfilRepository";
import { Perfil, desgloseVacio } from "../../../domain/perfil/entities/Perfil";
import { ErrorValidacion } from "../../../domain/perfil/errors/ErrorValidacion";

const perfilRepository = new PrismaPerfilRepository();
const obtenerPerfil = new ObtenerPerfil(perfilRepository);
const guardarPasoPerfil = new GuardarPasoPerfil(perfilRepository);

// Las fechas viajan como "AAAA-MM-DD", que es lo que usa <input type="date">.
function fechaATexto(fecha: Date | null): string | null {
    return fecha ? fecha.toISOString().slice(0, 10) : null;
}

// Forma unica de respuesta para GET y PUT del perfil:
// { perfil, completitud, desglose }
function aRespuesta(perfil: Perfil) {
    return {
        perfil: {
            id: perfil.id,
            nombreCompleto: perfil.nombreCompleto,
            telefono: perfil.telefono,
            ubicacion: perfil.ubicacion,
            resumen: perfil.resumen,
            modalidadPreferida: perfil.modalidadPreferida,
            expectativaSalarial: perfil.expectativaSalarial,
            disponibilidad: perfil.disponibilidad,
            experiencias: perfil.experiencias.map((e) => ({
                empresa: e.empresa,
                cargo: e.cargo,
                descripcion: e.descripcion,
                fechaInicio: fechaATexto(e.fechaInicio),
                fechaFin: fechaATexto(e.fechaFin),
            })),
            educaciones: perfil.educaciones.map((e) => ({
                institucion: e.institucion,
                titulo: e.titulo,
                nivel: e.nivel,
                fechaInicio: fechaATexto(e.fechaInicio),
                fechaFin: fechaATexto(e.fechaFin),
            })),
            habilidades: perfil.habilidades,
        },
        completitud: perfil.calcularCompletitud(),
        desglose: perfil.calcularDesglose(),
    };
}

export class PerfilController {
    static async obtener(req: Request, res: Response): Promise<void> {
        try {
            // req.usuarioId lo puso el authMiddleware, despues de validar el token.
            // Si llegamos aqui, es porque ya sabemos con certeza quien esta pidiendo esto.
            const usuarioId = req.usuarioId as string;

            const perfil = await obtenerPerfil.ejecutar(usuarioId);

            if (!perfil) {
                res.status(200).json({ perfil: null, completitud: 0, desglose: desgloseVacio() });
                return;
            }

            res.status(200).json(aRespuesta(perfil));
        } catch (error) {
            console.error("[perfil] Error inesperado al obtener el perfil:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    // Guarda un paso del wizard: PUT /perfil/paso/:paso
    static async guardarPaso(req: Request, res: Response): Promise<void> {
        const paso = req.params.paso as string;

        if (!(PASOS_PERFIL as readonly string[]).includes(paso)) {
            res.status(404).json({ error: `Paso desconocido. Pasos validos: ${PASOS_PERFIL.join(", ")}` });
            return;
        }

        try {
            const usuarioId = req.usuarioId as string;
            const perfil = await guardarPasoPerfil.ejecutar(usuarioId, paso as PasoPerfil, req.body);
            res.status(200).json(aRespuesta(perfil));
        } catch (error) {
            if (error instanceof ErrorValidacion) {
                res.status(400).json({ error: error.message, detalles: error.detalles });
                return;
            }
            console.error("[perfil] Error inesperado al guardar un paso:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}