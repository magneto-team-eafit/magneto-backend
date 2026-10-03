import { Router } from "express";
import { VacanteController } from "../controllers/VacanteController";

const router = Router();

router.get("/", VacanteController.listar);
router.get("/:id", VacanteController.obtenerPorId);

export default router;
