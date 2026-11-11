// Error de dominio: el usuario ya se habia postulado a esta vacante.
// Reemplaza al error crudo de Prisma (violacion de indice unico) para que el
// cliente reciba un mensaje claro y un codigo HTTP adecuado (409).

export class ErrorPostulacionDuplicada extends Error {
  constructor() {
    super("Ya te has postulado a esta vacante.");
    this.name = "ErrorPostulacionDuplicada";
  }
}
