// Error de dominio: el correo o la contrasena no son correctos.
// El mensaje es siempre el mismo, exista o no el correo, para no
// revelar que cuentas estan registradas.

export class ErrorCredencialesInvalidas extends Error {
  constructor() {
    super("Correo o contraseña incorrectos.");
    this.name = "ErrorCredencialesInvalidas";
  }
}