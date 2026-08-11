// ============================================================
// server.ts
// Este es el PUNTO DE ENTRADA de todo el backend.
// Es el primer archivo que se ejecuta cuando corres el proyecto.
// ============================================================

// "import" es la forma moderna de traer codigo de otras librerias.
// Es el equivalente a "USE nombre_libreria" si eso existiera en SQL.
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// dotenv.config() lee el archivo ".env" (que crearemos en el siguiente paso) y carga
// esas variables como si fueran variables normales del sistema.
// Por que? Para no escribir contrasenas o URLs de la BD directo en el codigo.
// Esto es parte de la seguridad OWASP que pide el documento de Magneto
// ("gestion de secretos: no exponer keys en el repositorio").
dotenv.config();

// express() crea la "aplicacion" -- el objeto que va a manejar
// todas las peticiones HTTP (GET, POST, PUT, DELETE) que lleguen.
const app = express();

// -----------------------------------------------------------
// MIDDLEWARES
// Un "middleware" es una funcion que se ejecuta ANTES de que
// la peticion llegue a tu logica de negocio. Es como un trigger
// en SQL: algo que corre automaticamente antes de la accion principal.
// -----------------------------------------------------------

// cors() permite que tu frontend (que corre en otro puerto/dominio,
// ej: http://localhost:3000) pueda hacer peticiones a este backend
// (ej: http://localhost:4000) sin que el navegador las bloquee por seguridad.
app.use(cors());

// express.json() le dice a Express: "cuando llegue una peticion con
// body en formato JSON, conviertelo automaticamente en un objeto JS
// que yo pueda leer como req.body.nombreDelCampo"
app.use(express.json());

// -----------------------------------------------------------
// RUTA DE PRUEBA (health check)
// Sirve para confirmar que el servidor esta vivo, muy comun
// en cualquier backend profesional.
// -----------------------------------------------------------
// app.get(ruta, callback) registra que hacer cuando alguien
// visite esta ruta con metodo GET.
app.get("/health", (req, res) => {
  // res.json() responde al cliente con un objeto convertido a JSON
  res.json({
    status: "ok",
    message: "Backend de Profile Manager corriendo correctamente",
  });
});

// -----------------------------------------------------------
// PUERTO DEL SERVIDOR
// process.env.PORT lee la variable de entorno PORT (definida en .env).
// El "|| 4000" es un valor por defecto: si no existe la variable, usa 4000.
// -----------------------------------------------------------
const PORT = process.env.PORT || 4000;

// app.listen() enciende el servidor y lo deja "escuchando" peticiones
// en el puerto indicado. El callback se ejecuta una sola vez, al arrancar.
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});