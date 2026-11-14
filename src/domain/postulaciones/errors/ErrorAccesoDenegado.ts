// Error de dominio: el usuario autenticado intenta operar sobre una
// postulacion que no le pertenece. Se traduce a un 403 en la capa HTTP.

export class ErrorAccesoDenegado extends Error {
  constructor() {
    super("No tienes permiso para acceder a esta postulación.");
    this.name = "ErrorAccesoDenegado";
  }
}
