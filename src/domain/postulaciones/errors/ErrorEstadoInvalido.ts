import { ESTADOS_POSTULACION } from "../estados";

// Error de dominio: se pidio cambiar una postulacion a un estado que no existe.

export class ErrorEstadoInvalido extends Error {
  constructor(valorRecibido: string) {
    super(
      `Estado inválido: "${valorRecibido}". Estados válidos: ${ESTADOS_POSTULACION.join(", ")}.`
    );
    this.name = "ErrorEstadoInvalido";
  }
}
