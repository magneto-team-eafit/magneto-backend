import { Router } from 'express';
import { PrismaPostulacionRepository } from '../../../infrastructure/repositories/PrismaPostulacionRepository';
import { PostulacionUseCase } from '../../../application/use-cases/PostulacionUseCase';
import { authMiddleware } from '../../perfil/middlewares/authMiddleware';

const router = Router();
const repo = new PrismaPostulacionRepository();
const useCase = new PostulacionUseCase(repo);

// Todas las rutas de notificaciones exigen token; el usuarioId sale del token.
router.use(authMiddleware);

/**
 * @openapi
 * /notificaciones:
 *   get:
 *     summary: Lista las notificaciones del usuario autenticado
 *     description: Se crea una por cada cambio de estado de una postulación. Van de la más reciente a la más antigua.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soloNoLeidas
 *         schema:
 *           type: boolean
 *         description: Con `true` devuelve solo las que aún no se han leído
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *       401:
 *         description: Token faltante, inválido o vencido
 *       500:
 *         description: Error interno del servidor
 */
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

/**
 * @openapi
 * /notificaciones/{id}/leida:
 *   patch:
 *     summary: Marca una notificación como leída
 *     description: Solo funciona con notificaciones propias. Si no existe o es de otra persona responde 404, sin revelar cuál de los dos casos es.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la notificación
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 *       401:
 *         description: Token faltante, inválido o vencido
 *       404:
 *         description: La notificación no existe
 *       500:
 *         description: Error interno del servidor
 */
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