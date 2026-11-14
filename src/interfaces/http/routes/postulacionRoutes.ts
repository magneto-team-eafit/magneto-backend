import { Router } from 'express';
import { PrismaPostulacionRepository } from '../../../infrastructure/repositories/PrismaPostulacionRepository';
import { PostulacionUseCase } from '../../../application/use-cases/PostulacionUseCase';
import { authMiddleware } from '../../perfil/middlewares/authMiddleware';
import { ErrorPostulacionDuplicada } from '../../../domain/postulaciones/errors/ErrorPostulacionDuplicada';
import { ErrorPostulacionNoEncontrada } from '../../../domain/postulaciones/errors/ErrorPostulacionNoEncontrada';
import { ErrorEstadoInvalido } from '../../../domain/postulaciones/errors/ErrorEstadoInvalido';
import { ErrorAccesoDenegado } from '../../../domain/postulaciones/errors/ErrorAccesoDenegado';
import { ErrorRecursoNoEncontrado } from '../../../domain/postulaciones/errors/ErrorRecursoNoEncontrado';

const router = Router();
const repo = new PrismaPostulacionRepository();
const useCase = new PostulacionUseCase(repo);

// Todas las rutas de postulaciones exigen token. El usuarioId sale del token
// (req.usuarioId, puesto por authMiddleware), nunca del cuerpo ni de la URL.
router.use(authMiddleware);

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
 *             required: [vacanteId]
 *             properties:
 *               vacanteId:
 *                 type: string
 *                 description: UUID de la vacante
 *     responses:
 *       201:
 *         description: Postulación creada exitosamente
 *       400:
 *         description: Falta vacanteId
 *       404:
 *         description: Vacante no encontrada
 *       409:
 *         description: Postulación duplicada
 *       500:
 *         description: Error interno del servidor
 */
// POST /postulaciones  (body: { vacanteId })
router.post('/', async (req, res) => {
  try {
    const usuarioId = req.usuarioId as string;
    const { vacanteId } = req.body;
    if (!vacanteId) {
      return res.status(400).json({ error: 'vacanteId es requerido' });
    }
    const postulacion = await useCase.postularUsuario(usuarioId, vacanteId);
    return res.status(201).json(postulacion);
  } catch (error: any) {
    if (error instanceof ErrorPostulacionDuplicada) {
      return res.status(409).json({ error: error.message });
    }
    if (error instanceof ErrorRecursoNoEncontrado) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[postulaciones] Error al crear la postulación:', error);
    return res.status(500).json({ error: 'Error al crear la postulación' });
  }
});

// GET /postulaciones/resumen  -> reporte del tablero del usuario autenticado.
router.get('/resumen', async (req, res) => {
  try {
    const usuarioId = req.usuarioId as string;
    const resumen = await useCase.obtenerResumen(usuarioId);
    return res.json(resumen);
  } catch (error: any) {
    console.error('[postulaciones] Error al obtener el resumen:', error);
    return res.status(500).json({ error: 'Error al obtener el resumen de postulaciones' });
  }
});

/**
 * @openapi
 * /api/postulaciones:
 *   get:
 *     summary: Obtiene la lista de postulaciones del usuario autenticado
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de postulaciones obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
// GET /postulaciones  -> postulaciones del usuario autenticado.
router.get('/', async (req, res) => {
  try {
    const usuarioId = req.usuarioId as string;
    const lista = await useCase.listarPostulaciones(usuarioId);
    return res.json(lista);
  } catch (error: any) {
    console.error('[postulaciones] Error al obtener las postulaciones:', error);
    return res.status(500).json({ error: 'Error al obtener las postulaciones' });
  }
});

// PATCH /postulaciones/:id/estado  (body: { estado })
router.patch('/:id/estado', async (req, res) => {
  try {
    const usuarioId = req.usuarioId as string;
    const { id } = req.params;
    const { estado } = req.body;
    if (!estado) {
      return res.status(400).json({ error: 'El campo estado es requerido' });
    }
    const postulacion = await useCase.cambiarEstado(id, usuarioId, estado);
    return res.json(postulacion);
  } catch (error: any) {
    if (error instanceof ErrorEstadoInvalido) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof ErrorPostulacionNoEncontrada) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof ErrorAccesoDenegado) {
      return res.status(403).json({ error: error.message });
    }
    console.error('[postulaciones] Error al cambiar el estado:', error);
    return res.status(500).json({ error: 'Error al cambiar el estado de la postulación' });
  }
});

// GET /postulaciones/:id/actividad  -> trazabilidad.
router.get('/:id/actividad', async (req, res) => {
  try {
    const usuarioId = req.usuarioId as string;
    const { id } = req.params;
    const actividad = await useCase.obtenerActividad(id, usuarioId);
    return res.json(actividad);
  } catch (error: any) {
    if (error instanceof ErrorPostulacionNoEncontrada) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof ErrorAccesoDenegado) {
      return res.status(403).json({ error: error.message });
    }
    console.error('[postulaciones] Error al obtener la actividad:', error);
    return res.status(500).json({ error: 'Error al obtener la actividad de la postulación' });
  }
});

export default router;