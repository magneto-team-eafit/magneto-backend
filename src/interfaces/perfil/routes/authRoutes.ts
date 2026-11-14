import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { limitadorLogin, limitadorRegistro } from "../middlewares/limitadorIntentos";

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
 *       429:
 *         description: Demasiados intentos
 */
router.post("/registro", limitadorRegistro, AuthController.registrar);

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
 *       429:
 *         description: Demasiados intentos
 */
router.post("/login", limitadorLogin, AuthController.login);

export default router;