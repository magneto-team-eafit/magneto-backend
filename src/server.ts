import { env } from "./config/env";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./interfaces/perfil/routes/authRoutes";
import perfilRoutes from "./interfaces/perfil/routes/perfilRoutes";
import vacanteRoutes from "./interfaces/vacantes/routes/vacanteRoutes";
import recommendationRoutes from "./recommendation/interfaces/recommendation.routes";
import postulacionRoutes from "./interfaces/http/routes/postulacionRoutes";
import notificacionRoutes from "./interfaces/http/routes/notificacionRoutes";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend de Profile Manager corriendo correctamente",
  });
});

app.use("/auth", authRoutes);
app.use("/perfil", perfilRoutes);
app.use("/vacantes", vacanteRoutes);
app.use("/recomendaciones", recommendationRoutes);
app.use("/postulaciones", postulacionRoutes);
app.use("/notificaciones", notificacionRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err: { type?: string }, req: Request, res: Response, _next: NextFunction) => {
  if (err.type === "entity.parse.failed") {
    res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
    return;
  }
  if (err.type === "entity.too.large") {
    res.status(413).json({ error: "La petición es demasiado grande." });
    return;
  }
  console.error("[servidor] Error no controlado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(env.puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${env.puerto}`);
});

export default app;