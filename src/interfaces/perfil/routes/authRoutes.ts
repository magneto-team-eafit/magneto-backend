import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { limitadorLogin, limitadorRegistro } from "../middlewares/limitadorIntentos";

const router = Router();

/**
 * @openapi
 * /auth/registro:
 *   post:
 *     summary: Registra un nuevo usuario
 *     description: El correo se guarda en minúsculas y la contraseña se almacena cifrada (nunca se devuelve).
 *     tags: [Auth]
 *     security: []
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
 *                 example: "laura@example.com"
 *               password:
 *                 type: string
 *                 description: Mínimo 8 caracteres
 *                 example: "Secreta123*"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Datos inválidos. Devuelve `error` y `detalles` con el mensaje de cada campo.
 *       409:
 *         description: Ya existe un usuario con ese correo
 *       429:
 *         description: Demasiados intentos de registro (límite de 10 por hora)
 */
router.post("/registro", limitadorRegistro, AuthController.registrar);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Inicia sesión en la plataforma
 *     tags: [Auth]
 *     security: []
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
 *                 example: "laura@example.com"
 *               password:
 *                 type: string
 *                 example: "Secreta123*"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT válido por 7 días. Se envía en el header `Authorization Bearer`.
 *                 usuarioId:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Falta el correo o la contraseña
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos fallidos (límite de 10 cada 15 minutos)
 */
router.post("/login", limitadorLogin, AuthController.login);

export default router;