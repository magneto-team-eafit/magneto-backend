// Error de dominio: no existe una postulacion con el id indicado.

export class ErrorPostulacionNoEncontrada extends Error {
  constructor() {
    super("La postulación no existe.");
    this.name = "ErrorPostulacionNoEncontrada";
  }
}
