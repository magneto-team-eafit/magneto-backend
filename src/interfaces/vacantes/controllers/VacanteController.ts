import { Request, Response } from "express";
import { ListarVacantes } from "../../../application/vacantes/useCases/ListarVacantes";
import { ObtenerVacante } from "../../../application/vacantes/useCases/ObtenerVacante";
import { PrismaVacanteRepository } from "../../../infrastructure/vacantes/repositories/PrismaVacanteRepository";

const vacanteRepository = new PrismaVacanteRepository();
const listarVacantes = new ListarVacantes(vacanteRepository);
const obtenerVacante = new ObtenerVacante(vacanteRepository);

function comoString(valor: unknown): string | undefined {
    return typeof valor === "string" ? valor : undefined;
}

function comoNumero(valor: unknown): number | undefined {
    if (typeof valor !== "string" || valor.trim() === "") return undefined;
    const n = Number(valor);
    return Number.isFinite(n) ? n : undefined;
}

export class VacanteController {
    static async listar(req: Request, res: Response): Promise<void> {
        try {
            const { ubicacion, modalidad, nivelExperiencia, salarioMin, salarioMax, q, pagina, limite } = req.query;

            const resultado = await listarVacantes.ejecutar({
                ubicacion: comoString(ubicacion),
                modalidad: comoString(modalidad),
                nivelExperiencia: comoString(nivelExperiencia),
                salarioMin: comoNumero(salarioMin),
                salarioMax: comoNumero(salarioMax),
                q: comoString(q),
                pagina: comoNumero(pagina),
                limite: comoNumero(limite),
            });

            res.status(200).json(resultado);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    static async obtenerPorId(req: Request, res: Response): Promise<void> {
        try {
            const vacante = await obtenerVacante.ejecutar(String(req.params.id));
            res.status(200).json(vacante);
        } catch (error) {
            if (error instanceof Error && error.message === "Vacante no encontrada") {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}
