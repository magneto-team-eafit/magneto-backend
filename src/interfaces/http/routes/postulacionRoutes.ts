import { Router } from 'express';
import { PrismaPostulacionRepository } from '../../../infrastructure/repositories/PrismaPostulacionRepository';
import { PostulacionUseCase } from '../../../application/use-cases/PostulacionUseCase';
import { ErrorPostulacionDuplicada } from '../../../domain/postulaciones/errors/ErrorPostulacionDuplicada';
import { ErrorPostulacionNoEncontrada } from '../../../domain/postulaciones/errors/ErrorPostulacionNoEncontrada';
import { ErrorEstadoInvalido } from '../../../domain/postulaciones/errors/ErrorEstadoInvalido';

const router = Router();
const repo = new PrismaPostulacionRepository();
const useCase = new PostulacionUseCase(repo);

// POST /postulaciones
router.post('/', async (req, res) => {
  try {
    const { usuarioId, vacanteId } = req.body;
    if (!usuarioId || !vacanteId) {
      return res.status(400).json({ error: 'usuarioId y vacanteId son requeridos' });
    }
    const postulacion = await useCase.postularUsuario(usuarioId, vacanteId);
    return res.status(201).json(postulacion);
  } catch (error: any) {
    // Postularse dos veces a la misma vacante ya no devuelve un error crudo de
    // la base de datos, sino un 409 con un mensaje claro.
    if (error instanceof ErrorPostulacionDuplicada) {
      return res.status(409).json({ error: error.message });
    }
    console.error('[postulaciones] Error al crear la postulación:', error);
    return res.status(500).json({ error: 'Error al crear la postulación' });
  }
});

// GET /postulaciones/:usuarioId
router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const lista = await useCase.listarPostulaciones(usuarioId);
    return res.json(lista);
  } catch (error: any) {
    console.error('[postulaciones] Error al obtener las postulaciones:', error);
    return res.status(500).json({ error: 'Error al obtener las postulaciones' });
  }
});

// PATCH /postulaciones/:id/estado
// Cambia el estado de una postulacion. Es el endpoint que usan los botones de
// las tarjetas del tablero (en revisión, entrevista, descartado).
router.patch('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!estado) {
      return res.status(400).json({ error: 'El campo estado es requerido' });
    }
    const postulacion = await useCase.cambiarEstado(id, estado);
    return res.json(postulacion);
  } catch (error: any) {
    if (error instanceof ErrorEstadoInvalido) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof ErrorPostulacionNoEncontrada) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[postulaciones] Error al cambiar el estado:', error);
    return res.status(500).json({ error: 'Error al cambiar el estado de la postulación' });
  }
});

// GET /postulaciones/:id/actividad
// Historial de actividad (trazabilidad) de una postulacion.
router.get('/:id/actividad', async (req, res) => {
  try {
    const { id } = req.params;
    const actividad = await useCase.obtenerActividad(id);
    return res.json(actividad);
  } catch (error: any) {
    if (error instanceof ErrorPostulacionNoEncontrada) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[postulaciones] Error al obtener la actividad:', error);
    return res.status(500).json({ error: 'Error al obtener la actividad de la postulación' });
  }
});

export default router;
