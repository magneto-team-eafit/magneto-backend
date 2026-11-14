import { Router } from "express";
import { PerfilController } from "../controllers/PerfilController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @openapi
 * /api/perfil:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido exitosamente
 *       401:
 *         description: No autorizado, token faltante o inválido
 */
router.get("/", authMiddleware, PerfilController.obtener);

/**
 * @openapi
 * /api/perfil/paso/{paso}:
 *   put:
 *     summary: Guarda o actualiza un paso específico del wizard del perfil
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paso
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número del paso del wizard (ej. 1 al 5)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Objeto con los datos específicos del paso
 *     responses:
 *       200:
 *         description: Paso guardado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.put("/paso/:paso", authMiddleware, PerfilController.guardarPaso);

export default router;