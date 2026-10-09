import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./interfaces/perfil/routes/authRoutes";
import perfilRoutes from "./interfaces/perfil/routes/perfilRoutes";
import vacanteRoutes from "./interfaces/vacantes/routes/vacanteRoutes";
import recommendationRoutes from "./recommendation/interfaces/recommendation.routes";

dotenv.config();

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

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
