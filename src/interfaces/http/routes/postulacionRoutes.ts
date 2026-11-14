import { Router } from 'express';
import { PrismaPostulacionRepository } from '../../../infrastructure/repositories/PrismaPostulacionRepository';
import { PostulacionUseCase } from '../../../application/use-cases/PostulacionUseCase';

const router = Router();
const repo = new PrismaPostulacionRepository();
const useCase = new PostulacionUseCase(repo);

/**
 * @openapi
 * /api/postulaciones:
 *   post:
 *     summary: Crea una nueva postulación a una vacante
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuarioId, vacanteId]
 *             properties:
 *               usuarioId:
 *                 type: string
 *                 description: UUID del usuario que se postula
 *               vacanteId:
 *                 type: string
 *                 description: UUID de la vacante
 *     responses:
 *       201:
 *         description: Postulación creada exitosamente
 *       400:
 *         description: Falta usuarioId o vacanteId
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', async (req, res) => {
  try {
    const { usuarioId, vacanteId } = req.body;
    if (!usuarioId || !vacanteId) {
      return res.status(400).json({ error: 'usuarioId y vacanteId son requeridos' });
    }
    const postulacion = await useCase.postularUsuario(usuarioId, vacanteId);
    return res.status(201).json(postulacion);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al crear la postulación' });
  }
});

/**
 * @openapi
 * /api/postulaciones/{usuarioId}:
 *   get:
 *     summary: Obtiene la lista de postulaciones de un usuario
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID del usuario
 *     responses:
 *       200:
 *         description: Lista de postulaciones obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const lista = await useCase.listarPostulaciones(usuarioId);
    return res.json(lista);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al obtener las postulaciones' });
  }
});

export default router;