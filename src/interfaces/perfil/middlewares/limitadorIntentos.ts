import rateLimit from "express-rate-limit";

// Limita los intentos para frenar ataques de fuerza bruta (probar muchas
// contrasenas) y el registro masivo de cuentas. Se cuenta por direccion IP.

// Login: maximo 10 intentos FALLIDOS cada 15 minutos. Los inicios de sesion
// exitosos no cuentan, asi un usuario legitimo nunca se bloquea.
export const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos." },
});

// Registro: maximo 10 cuentas nuevas por hora desde la misma IP.
export const limitadorRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiados registros desde esta conexión. Intenta de nuevo más tarde." },
});