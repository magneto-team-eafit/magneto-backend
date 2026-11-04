// El import de config va primero: carga el .env y valida los secretos
// antes de que se cargue cualquier otro modulo.
import { env } from "./config/env";
import express from "express";
import cors from "cors";
import authRoutes from "./interfaces/perfil/routes/authRoutes";
import perfilRoutes from "./interfaces/perfil/routes/perfilRoutes";
import vacanteRoutes from "./interfaces/vacantes/routes/vacanteRoutes";
import recommendationRoutes from "./recommendation/interfaces/recommendation.routes";
import postulacionRoutes from "./interfaces/http/routes/postulacionRoutes";

const app = express();

app.use(cors());
app.use(express.json());

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

app.listen(env.puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${env.puerto}`);
});