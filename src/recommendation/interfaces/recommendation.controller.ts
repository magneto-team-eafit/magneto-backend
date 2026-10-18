import { Request, Response } from 'express';
import { obtenerRecomendacionesPorUsuarioId,
  obtenerHistorialPorUsuarioId,
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