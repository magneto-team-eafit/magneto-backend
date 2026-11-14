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
 * /postulaciones:
 *   post:
 *     summary: Crea una postulación a una vacante
 *     description: El usuario sale del token. La postulación nace en estado POSTULADO.
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
 *         description: Postulación creada
 *       400:
 *         description: Falta vacanteId
 *       401:
 *         description: Token faltante, inválido o vencido
 *       404:
 *         description: La vacante no existe
 *       409:
 *         description: Ya te postulaste a esta vacante
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

/**
 * @openapi
 * /postulaciones/resumen:
 *   get:
 *     summary: Reporte del tablero del usuario
 *     description: Total de postulaciones, cantidad por estado y tasa de avance (proporción que ya salió de POSTULADO, entre 0 y 1).
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen del tablero
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 porEstado:
 *                   type: object
 *                   properties:
 *                     POSTULADO:
 *                       type: integer
 *                     EN_REVISION:
 *                       type: integer
 *                     ENTREVISTA:
 *                       type: integer
 *                     DESCARTADO:
 *                       type: integer
 *                 tasaAvance:
 *                   type: number
 *       401:
 *         description: Token faltante, inválido o vencido
 *       500:
 *         description: Error interno del servidor
 */
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
 * /postulaciones:
 *   get:
 *     summary: Lista las postulaciones del usuario autenticado
 *     description: Cada postulación incluye los datos de su vacante. Van de la más reciente a la más antigua.
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de postulaciones
 *       401:
 *         description: Token faltante, inválido o vencido
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

/**
 * @openapi
 * /postulaciones/{id}/estado:
 *   patch:
 *     summary: Cambia el estado de una postulación
 *     description: Solo la persona dueña puede cambiarlo. Cada cambio deja una entrada en el registro de actividad y crea una notificación. Una postulación DESCARTADO se puede reabrir.
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la postulación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [POSTULADO, EN_REVISION, ENTREVISTA, DESCARTADO]
 *     responses:
 *       200:
 *         description: Postulación con su nuevo estado
 *       400:
 *         description: Falta el estado o no es válido
 *       401:
 *         description: Token faltante, inválido o vencido
 *       403:
 *         description: La postulación es de otra persona
 *       404:
 *         description: La postulación no existe
 *       500:
 *         description: Error interno del servidor
 */
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

/**
 * @openapi
 * /postulaciones/{id}/actividad:
 *   get:
 *     summary: Historial de cambios de una postulación
 *     description: Registro de actividad (trazabilidad), del más reciente al más antiguo. Solo la persona dueña puede verlo.
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la postulación
 *     responses:
 *       200:
 *         description: Lista de eventos de la postulación
 *       401:
 *         description: Token faltante, inválido o vencido
 *       403:
 *         description: La postulación es de otra persona
 *       404:
 *         description: La postulación no existe
 *       500:
 *         description: Error interno del servidor
 */
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