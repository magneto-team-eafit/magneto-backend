import { Router } from 'express';
import { getRecomendacionesHandler,
        getHistorialHandler,
} from "./recommendation.controller";

const router = Router();

router.get("/:usuarioId", getRecomendacionesHandler);
router.get("/:usuarioId/historial", getHistorialHandler);

export default router;
