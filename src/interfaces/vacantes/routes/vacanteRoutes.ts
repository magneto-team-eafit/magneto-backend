import { Router } from "express";
import { VacanteController } from "../controllers/VacanteController";

const router = Router();

router.get("/", VacanteController.listar);

export default router;