// Estados posibles de una postulacion. Son las columnas del tablero de
// seguimiento en el frontend. El orden refleja el avance tipico del proceso.
export const ESTADOS_POSTULACION = [
  "POSTULADO",
  "EN_REVISION",
  "ENTREVISTA",
  "DESCARTADO",
] as const;

export type EstadoPostulacion = (typeof ESTADOS_POSTULACION)[number];

// Etiquetas legibles para mostrar en notificaciones y registros de actividad.
export const ETIQUETA_ESTADO: Record<EstadoPostulacion, string> = {
  POSTULADO: "Postulado",
  EN_REVISION: "En revisión",
  ENTREVISTA: "Entrevista",
  DESCARTADO: "Descartado",
};

export function esEstadoValido(valor: string): valor is EstadoPostulacion {
  return (ESTADOS_POSTULACION as readonly string[]).includes(valor);
}
