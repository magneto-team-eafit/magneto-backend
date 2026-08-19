import { Request, Response } from 'express';
import { obtenerRecomendacionesPorUsuarioId } from '../application/recommendation.service';

export async function getRecomendacionesHandler(req: Request, res: Response) {
  try {
    const { usuarioId } = req.params;

    if (!usuarioId) {
      return res.status(400).json({ error: 'El parámetro usuarioId es requerido.' });
    }

    const recomendaciones = await obtenerRecomendacionesPorUsuarioId(usuarioId);
    return res.status(200).json(recomendaciones);
  } catch (error: any) {
    console.error('Error al generar recomendaciones:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor.' });
  }
}
