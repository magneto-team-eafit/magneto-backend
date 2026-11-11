import { Router } from 'express';
import { PrismaPostulacionRepository } from '../../../infrastructure/repositories/PrismaPostulacionRepository';
import { PostulacionUseCase } from '../../../application/use-cases/PostulacionUseCase';

const router = Router();
const repo = new PrismaPostulacionRepository();
const useCase = new PostulacionUseCase(repo);

// GET /notificaciones/:usuarioId
// Lista las notificaciones de un usuario. Con ?soloNoLeidas=true solo devuelve
// las que aun no ha leido.
router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const soloNoLeidas = req.query.soloNoLeidas === 'true';
    const notificaciones = await useCase.listarNotificaciones(usuarioId, soloNoLeidas);
    return res.json(notificaciones);
  } catch (error: any) {
    console.error('[notificaciones] Error al obtener las notificaciones:', error);
    return res.status(500).json({ error: 'Error al obtener las notificaciones' });
  }
});

// PATCH /notificaciones/:id/leida
// Marca una notificacion como leida. Requiere el usuarioId en el cuerpo para
// evitar que un usuario marque notificaciones que no son suyas.
router.patch('/:id/leida', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;
    if (!usuarioId) {
      return res.status(400).json({ error: 'usuarioId es requerido' });
    }
    const actualizada = await useCase.marcarNotificacionLeida(id, usuarioId);
    if (!actualizada) {
      return res.status(404).json({ error: 'La notificación no existe' });
    }
    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[notificaciones] Error al marcar como leída:', error);
    return res.status(500).json({ error: 'Error al marcar la notificación como leída' });
  }
});

export default router;
