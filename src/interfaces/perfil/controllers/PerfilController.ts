import { Request, Response } from "express";    
import { ObtenerPerfil } from "../../../application/perfil/useCases/ObtenerPerfil";
import { ActualizarPerfil } from "../../../application/perfil/useCases/ActualizarPerfil";
import { PrismaPerfilRepository } from "../../../infrastructure/perfil/repositories/PrismaPerfilRepository";
import { resourceLimits } from "node:worker_threads";

const perfilRepository = new PrismaPerfilRepository();
const obtenerPerfil = new ObtenerPerfil(perfilRepository);
const actualizarPerfil = new ActualizarPerfil(perfilRepository);

export class PerfilController {
    static async obtener(req: Request, res: Response): Promise <void> {
        try {
        // req.usuarioId lo puso el authMiddleware, despues de validar el token.
        // Si llegamos aqui, es porque ya sabemos con certeza quien esta pidiendo esto.
            const usuarioId = req.usuarioId as string;

            const perfil = await obtenerPerfil.ejecutar(usuarioId);

            if (!perfil) {
                res.status(200).json({ perfil: null, completitud: 0});
                return;
            }

            res.status(200).json({
                id: perfil.id,
                nombreCompleto: perfil.nombreCompleto,
                telefono: perfil.telefono,
                ubicacion: perfil.ubicacion,
                resumen: perfil.resumen,
                modalidadPreferida: perfil.modalidadPreferida,
                expectativaSalarial: perfil.expectativaSalarial,
                disponibilidad: perfil.disponibilidad,
                completitud: perfil.calcularCompletitud(),
            });
        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.usuarioId as string;
      const { nombreCompleto, telefono, ubicacion, resumen, modalidadPreferida, expectativaSalarial, disponibilidad } = req.body;

      if (!nombreCompleto || nombreCompleto.trim().length === 0) {
        res.status(400).json({ error: "El nombre completo es obligatorio" });
        return;
      }

      const perfil = await actualizarPerfil.ejecutar({
        usuarioId,
        nombreCompleto,
        telefono,
        ubicacion,
        resumen,
        modalidadPreferida,
        expectativaSalarial,
        disponibilidad,
      });

      res.status(200).json({
        id: perfil.id,
        nombreCompleto: perfil.nombreCompleto,
        telefono: perfil.telefono,
        ubicacion: perfil.ubicacion,
        resumen: perfil.resumen,
        modalidadPreferida: perfil.modalidadPreferida,
        expectativaSalarial: perfil.expectativaSalarial,
        disponibilidad: perfil.disponibilidad,
        completitud: perfil.calcularCompletitud(),
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
    

}