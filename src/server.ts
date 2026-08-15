import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./interfaces/perfil/routes/authRoutes"; //
import vacanteRoutes from "./interfaces/vacantes/routes/vacanteRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/vacantes", vacanteRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend de Profile Manager corriendo correctamente",
  });
});

// NUEVO: todas las rutas dentro de authRoutes van a vivir bajo /auth
app.use("/auth", authRoutes); // NUEVO

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
