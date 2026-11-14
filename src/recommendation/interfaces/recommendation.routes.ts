import { Router } from 'express';
import { getRecomendacionesHandler,
        getHistorialHandler,
} from "./recommendation.controller";
import { authMiddleware } from "../../interfaces/perfil/middlewares/authMiddleware";
import { soloPropietario } from "../../interfaces/perfil/middlewares/soloPropietario";

const router = Router();

// Las recomendaciones son datos personales: hace falta token y el usuarioId
// de la URL debe ser el del token.

/**
 * @openapi
 * /recomendaciones/{usuarioId}:
 *   get:
 *     summary: Vacantes recomendadas para el usuario
 *     description: Calcula la compatibilidad entre el perfil y las vacantes. El usuarioId de la URL debe ser el del token.
 *     tags: [Recomendaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vacantes con su puntaje, el desglose y los motivos, de mayor a menor compatibilidad
 *       401:
 *         description: Token faltante, inválido o vencido
 *       403:
 *         description: El usuarioId de la URL no es el del token
 *       404:
 *         description: El usuario o su perfil no existe
 *       500:
 *         description: Error interno del servidor
 */
router.get("/:usuarioId", authMiddleware, soloPropietario, getRecomendacionesHandler);

/**
 * @openapi
 * /recomendaciones/{usuarioId}/historial:
 *   get:
 *     summary: Historial de recomendaciones del usuario
 *     description: Las últimas 100 recomendaciones guardadas. El usuarioId de la URL debe ser el del token.
 *     tags: [Recomendaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista del historial, de la más reciente a la más antigua
 *       401:
 *         description: Token faltante, inválido o vencido
 *       403:
 *         description: El usuarioId de la URL no es el del token
 *       500:
 *         description: Error interno del servidor
 */
router.get("/:usuarioId/historial", authMiddleware, soloPropietario, getHistorialHandler);

export default router;