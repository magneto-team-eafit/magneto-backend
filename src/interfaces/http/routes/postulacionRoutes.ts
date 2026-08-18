import { Router } from 'express';
import { PrismaPostulacionRepository } from '../../../infrastructure/repositories/PrismaPostulacionRepository';
import { PostulacionUseCase } from '../../../application/use-cases/PostulacionUseCase';

const router = Router();
const repo = new PrismaPostulacionRepository();
const useCase = new PostulacionUseCase(repo);

// POST /api/postulaciones
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

// GET /api/postulaciones/:usuarioId
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
