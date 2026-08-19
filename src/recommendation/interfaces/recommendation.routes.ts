import { Router } from 'express';
import { getRecomendacionesHandler } from './recommendation.controller';

const router = Router();

// GET /recomendaciones/:usuarioId
router.get('/:usuarioId', getRecomendacionesHandler);

export default router;
