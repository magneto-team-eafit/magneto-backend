import { Router } from 'express';
import { getRecomendacionesHandler,
        getHistorialHandler,
} from "./recommendation.controller";
import { authMiddleware } from "../../interfaces/perfil/middlewares/authMiddleware";
import { soloPropietario } from "../../interfaces/perfil/middlewares/soloPropietario";

const router = Router();

// Las recomendaciones son datos personales: hace falta token y el usuarioId
// de la URL debe ser el del token.
router.get("/:usuarioId", authMiddleware, soloPropietario, getRecomendacionesHandler);
router.get("/:usuarioId/historial", authMiddleware, soloPropietario, getHistorialHandler);

export default router;