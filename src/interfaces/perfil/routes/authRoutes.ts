import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { limitadorLogin, limitadorRegistro } from "../middlewares/limitadorIntentos";

const router = Router();

// El limitador va antes del controlador: si se superan los intentos,
// la peticion se rechaza con 429 sin llegar a consultar la base de datos.
router.post("/registro", limitadorRegistro, AuthController.registrar);
router.post("/login", limitadorLogin, AuthController.login);

export default router;