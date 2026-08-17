import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();

router.post("/registro", AuthController.registrar);
router.post("/login", AuthController.login);

export default router;