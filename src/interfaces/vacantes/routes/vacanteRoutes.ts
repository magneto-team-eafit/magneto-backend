import { Router } from "express";
import { VacanteController } from "../controllers/VacanteController";

const router = Router();

/**
 * @openapi
 * /vacantes:
 *   get:
 *     summary: Obtiene la lista paginada de vacantes
 *     description: Es público (no requiere token). Con `q` usa búsqueda de texto completo sobre título, empresa y descripción. Los resultados van de la más reciente a la más antigua.
 *     tags: [Vacantes]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Texto a buscar (ej. "analista")
 *       - in: query
 *         name: ubicacion
 *         schema:
 *           type: string
 *         description: Ciudad o departamento (ej. "Medellín")
 *       - in: query
 *         name: modalidad
 *         schema:
 *           type: string
 *           enum: [remoto, presencial, hibrido]
 *       - in: query
 *         name: nivelExperiencia
 *         schema:
 *           type: string
 *       - in: query
 *         name: salarioMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: salarioMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Vacantes por página (si no es válido se usa el valor por defecto)
 *     responses:
 *       200:
 *         description: Vacantes de la página pedida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vacantes:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 pagina:
 *                   type: integer
 *                 totalPaginas:
 *                   type: integer
 *       400:
 *         description: Parámetros inválidos
 */
router.get("/", VacanteController.listar);

/**
 * @openapi
 * /vacantes/{id}:
 *   get:
 *     summary: Obtiene el detalle de una vacante
 *     description: Es público (no requiere token).
 *     tags: [Vacantes]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la vacante
 *     responses:
 *       200:
 *         description: Detalle completo de la vacante
 *       404:
 *         description: La vacante no existe
 */
router.get("/:id", VacanteController.obtenerPorId);

export default router;