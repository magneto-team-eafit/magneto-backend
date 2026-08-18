import { Request, Response } from "express";
import { ListarVacantes } from "../../../application/vacantes/useCases/ListarVacantes";
import { PrismaVacanteRepository } from "../../../infrastructure/vacantes/repositories/PrismaVacanteRepository";

const vacanteRepository = new PrismaVacanteRepository();
const listarVacantes = new ListarVacantes(vacanteRepository);

export class VacanteController {
    static async listar(req: Request, res: Response): Promise<void> {
        try {
            const { ubicacion, modalidad, pagina, limite } = req.query;

            const resultado = await listarVacantes.ejecutar({
                ubicacion: typeof ubicacion === "string" ? ubicacion : undefined,
                modalidad: typeof modalidad === "string" ? modalidad : undefined,
                pagina: pagina ? Number(pagina) : undefined,
                limite: limite ? Number(limite) : undefined,
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
}