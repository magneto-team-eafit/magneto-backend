import { Router } from "express";
import { PerfilController } from "../controllers/PerfilController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// authMiddleware va ANTES del controlador en ambas rutas: la peticion
// pasa primero por ahi, y solo si el token es valido llega al controlador.
router.get("/", authMiddleware, PerfilController.obtener);
router.put("/", authMiddleware, PerfilController.actualizar);

export default router;