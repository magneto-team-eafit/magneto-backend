import { Router } from "express";
import { VacanteController } from "../controllers/VacanteController";

const router = Router();

/**
 * @openapi
 * /api/vacantes:
 *   get:
 *     summary: Obtiene la lista paginada de vacantes
 *     description: Permite filtrar vacantes por búsqueda de texto, ubicación, modalidad y salarios usando el índice GIN.
 *     tags: [Vacantes]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda (ej. "desarrollador")
 *       - in: query
 *         name: ubicacion
 *         schema:
 *           type: string
 *         description: Ciudad o departamento (ej. "Medellín")
 *       - in: query
 *         name: modalidad
 *         schema:
 *           type: string
 *         description: Modalidad de trabajo (remoto, presencial, hibrido)
 *       - in: query
 *         name: nivelExperiencia
 *         schema:
 *           type: string
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de vacantes por página
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Retorna el total de vacantes y la lista según los filtros
 */
router.get("/", VacanteController.listar);

/**
 * @openapi
 * /api/vacantes/{id}:
 *   get:
 *     summary: Obtiene los detalles de una vacante específica por ID
 *     tags: [Vacantes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la vacante
 *     responses:
 *       200:
 *         description: Detalles completos de la vacante
 *       404:
 *         description: Vacante no encontrada
 */
router.get("/:id", VacanteController.obtenerPorId);

export default router;