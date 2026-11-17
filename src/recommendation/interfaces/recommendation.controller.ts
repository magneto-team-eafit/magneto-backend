import { Request, Response } from 'express';
import { obtenerRecomendacionesPorUsuarioId,
  obtenerHistorialPorUsuarioId,
  descartarVacante,
} from "../application/recommendation.service";

export async function getRecomendacionesHandler(
  req: Request,
  res: Response
) {
  try {
    const usuarioId = req.params.usuarioId;

    if (!usuarioId) {
      return res.status(400).json({
        error: "El parámetro usuarioId es obligatorio.",
      });
    }

    const recomendaciones = await obtenerRecomendacionesPorUsuarioId(String(usuarioId));
    return res.status(200).json(recomendaciones);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error interno del servidor.";

    if (mensaje === "El usuario o su perfil no existe.") {
      return res.status(404).json({ error: mensaje });
    }

    console.error("Error al generar recomendaciones:", error);
    return res.status(500).json({
      error: "No fue posible generar las recomendaciones.",
    });
  }
}

export async function getHistorialHandler(
  req: Request,
  res: Response
) {
  try {
    const usuarioId = req.params.usuarioId;

    if (!usuarioId) {
      return res.status(400).json({
        error: "El parámetro usuarioId es obligatorio.",
      });
    }

    const historial = await obtenerHistorialPorUsuarioId(String(usuarioId));

    return res.status(200).json(historial);
  } catch (error) {
    console.error("Error al consultar el historial:", error);

    return res.status(500).json({
      error: "No fue posible consultar el historial.",
    });
  }
}

export async function postDescarteHandler(req: Request, res: Response) {
  try {
    const usuarioId = String(req.params.usuarioId);
    const vacanteId = typeof req.body?.vacanteId === "string" ? req.body.vacanteId.trim() : "";

    if (!vacanteId) {
      return res.status(400).json({ error: "El campo vacanteId es obligatorio." });
    }

    const existe = await descartarVacante(usuarioId, vacanteId);
    if (!existe) {
      return res.status(404).json({ error: "La vacante no existe." });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("Error al descartar la vacante:", error);
    return res.status(500).json({ error: "No fue posible descartar la vacante." });
  }
}
