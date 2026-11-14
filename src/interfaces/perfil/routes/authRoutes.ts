import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();

/**
 * @openapi
 * /api/auth/registro:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, nombre]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "matias@example.com"
 *               password:
 *                 type: string
 *                 example: "Secreta123*"
 *               nombre:
 *                 type: string
 *                 example: "Matias Zapata"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validación en los datos
 */
router.post("/registro", AuthController.registrar);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión en la plataforma
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "matias@example.com"
 *               password:
 *                 type: string
 *                 example: "Secreta123*"
 *     responses:
 *       200:
 *         description: Login exitoso. Retorna datos de usuario y token JWT.
 *       401:
 *         description: Credenciales inválidas
 */
router.post("/login", AuthController.login);

export default router;