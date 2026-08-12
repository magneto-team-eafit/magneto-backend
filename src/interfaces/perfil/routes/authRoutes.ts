import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();

router.post("/registro", AuthController.registrar);

export default router;