// Error de dominio: un recurso referenciado no existe (usuario o vacante).
// Permite responder 404 en vez del 500 crudo de Prisma cuando la clave
// foranea no apunta a ninguna fila.

export class ErrorRecursoNoEncontrado extends Error {
  constructor(recurso: string) {
    super(`${recurso} no existe.`);
    this.name = "ErrorRecursoNoEncontrado";
  }
}
