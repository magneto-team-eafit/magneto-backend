import { Router } from "express";
import { PerfilController } from "../controllers/PerfilController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @openapi
 * /perfil:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     description: Incluye el porcentaje de completitud, el desglose por sección y las sugerencias para mejorarlo. Si el usuario aún no tiene perfil, devuelve `perfil` en null y `completitud` en 0.
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil con su completitud
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 perfil:
 *                   type: object
 *                   nullable: true
 *                 completitud:
 *                   type: number
 *                   description: Porcentaje de 0 a 100
 *                 desglose:
 *                   type: object
 *                   description: Puntos obtenidos y máximos de cada sección
 *                 sugerencias:
 *                   type: array
 *                   description: Una por cada sección incompleta, de la que más suma a la que menos
 *                   items:
 *                     type: object
 *                     properties:
 *                       seccion:
 *                         type: string
 *                       titulo:
 *                         type: string
 *                       detalle:
 *                         type: string
 *                       faltantes:
 *                         type: array
 *                         items:
 *                           type: string
 *                       puntos:
 *                         type: number
 *       401:
 *         description: Token faltante, inválido o vencido
 */
router.get("/", authMiddleware, PerfilController.obtener);

/**
 * @openapi
 * /perfil/paso/{paso}:
 *   put:
 *     summary: Guarda un paso del asistente del perfil
 *     description: |
 *       El cuerpo depende del paso.
 *       - `datos-personales`: nombreCompleto, telefono, ubicacion, resumen. Crea el perfil la primera vez.
 *       - `experiencia`: lista de experiencias con empresa, cargo, descripcion, fechaInicio y fechaFin.
 *       - `educacion`: lista de estudios con institucion, titulo, nivel, fechaInicio y fechaFin.
 *       - `habilidades`: lista de nombres de habilidades.
 *       - `preferencias`: modalidadPreferida, expectativaSalarial y disponibilidad.
 *       Los pasos distintos de `datos-personales` exigen que el perfil ya exista.
 *       Cada guardado reemplaza lo que había en ese paso.
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paso
 *         required: true
 *         schema:
 *           type: string
 *           enum: [datos-personales, experiencia, educacion, habilidades, preferencias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Paso guardado. Devuelve el perfil actualizado con su completitud, desglose y sugerencias.
 *       400:
 *         description: Datos inválidos. Devuelve `error` y `detalles` por campo.
 *       401:
 *         description: Token faltante, inválido o vencido
 *       404:
 *         description: El paso no existe
 */
router.put("/paso/:paso", authMiddleware, PerfilController.guardarPaso);

export default router;