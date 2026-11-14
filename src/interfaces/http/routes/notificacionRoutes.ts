import { Router } from 'express';
import { PrismaPostulacionRepository } from '../../../infrastructure/repositories/PrismaPostulacionRepository';
import { PostulacionUseCase } from '../../../application/use-cases/PostulacionUseCase';
import { authMiddleware } from '../../perfil/middlewares/authMiddleware';

const router = Router();
const repo = new PrismaPostulacionRepository();
const useCase = new PostulacionUseCase(repo);

// Todas las rutas de notificaciones exigen token; el usuarioId sale del token.
router.use(authMiddleware);

// GET /notificaciones  -> notificaciones del usuario autenticado.
// Con ?soloNoLeidas=true solo devuelve las que aun no ha leido.
router.get('/', async (req, res) => {
  try {
    const usuarioId = req.usuarioId as string;
    const soloNoLeidas = req.query.soloNoLeidas === 'true';
    const notificaciones = await useCase.listarNotificaciones(usuarioId, soloNoLeidas);
    return res.json(notificaciones);
  } catch (error: any) {
    console.error('[notificaciones] Error al obtener las notificaciones:', error);
    return res.status(500).json({ error: 'Error al obtener las notificaciones' });
  }
});

// PATCH /notificaciones/:id/leida
// Marca una notificacion como leida. El usuarioId sale del token, y el
// repositorio solo actualiza si la notificacion es de ese usuario.
router.patch('/:id/leida', async (req, res) => {
  try {
    const usuarioId = req.usuarioId as string;
    const { id } = req.params;
    const actualizada = await useCase.marcarNotificacionLeida(id, usuarioId);
    if (!actualizada) {
      // No existe o no es del usuario: en ambos casos 404 (no revelamos cual).
      return res.status(404).json({ error: 'La notificación no existe' });
    }
    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[notificaciones] Error al marcar como leída:', error);
    return res.status(500).json({ error: 'Error al marcar la notificación como leída' });
  }
});

export default router;
