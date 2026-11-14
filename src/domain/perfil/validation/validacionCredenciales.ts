// Validacion y normalizacion de las credenciales (registro e inicio de sesion).

import type { Errores } from "./validadores";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL = 254;
const MIN_PASSWORD = 8;
const MAX_PASSWORD_BYTES = 72; // bcrypt solo usa los primeros 72 bytes
const MAX_PASSWORD_LOGIN = 128; // evita gastar calculo en contrasenas absurdas

function comoObjeto(entrada: unknown): Record<string, unknown> {
  return typeof entrada === "object" && entrada !== null ? (entrada as Record<string, unknown>) : {};
}

// El correo se compara siempre en minusculas y sin espacios.
export function normalizarEmail(valor: unknown): string {
  return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

export function validarCredencialesRegistro(entrada: unknown): { email: string; password: string; errores: Errores } {
  const errores: Errores = {};
  const e = comoObjeto(entrada);

  const email = normalizarEmail(e.email);
  if (email === "") {
    errores.email = "El correo electrónico es obligatorio.";
  } else if (email.length > MAX_EMAIL || !REGEX_EMAIL.test(email)) {
    errores.email = "Ingresa un correo electrónico válido.";
  }

  const password = typeof e.password === "string" ? e.password : "";
  if (password === "") {
    errores.password = "La contraseña es obligatoria.";
  } else if (password.length < MIN_PASSWORD) {
    errores.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  } else if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    errores.password = "La contraseña es demasiado larga (máximo 72 caracteres).";
  } else if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
    errores.password = "La contraseña debe incluir al menos una letra y un número.";
  }

  return { email, password, errores };
}

// En el login no se aplica la politica de contrasenas (una cuenta antigua
// podria no cumplirla): solo se revisa que lleguen los dos datos.
export function validarCredencialesLogin(entrada: unknown): { email: string; password: string; errores: Errores } {
  const errores: Errores = {};
  const e = comoObjeto(entrada);

  const email = normalizarEmail(e.email);
  const password = typeof e.password === "string" ? e.password : "";

  if (email === "" || password === "") {
    errores.credenciales = "El correo y la contraseña son obligatorios.";
  }
  if (password.length > MAX_PASSWORD_LOGIN) {
    errores.credenciales = "Correo o contraseña incorrectos.";
  }

  return { email, password, errores };
}