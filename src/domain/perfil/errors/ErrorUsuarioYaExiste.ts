// Error de dominio: ya hay una cuenta registrada con ese correo.

export class ErrorUsuarioYaExiste extends Error {
  constructor() {
    super("Ya existe una cuenta con este correo electrónico.");
    this.name = "ErrorUsuarioYaExiste";
  }
}