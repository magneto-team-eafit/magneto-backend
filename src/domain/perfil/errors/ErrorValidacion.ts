// Error de dominio: los datos recibidos no cumplen las reglas.
// "detalles" mapea cada campo con su mensaje, para que el frontend
// pueda mostrar el error junto al campo correcto.

export class ErrorValidacion extends Error {
    constructor(public readonly detalles: Record<string, string>) {
        super("Hay campos con informacion invalida");
        this.name = "ErrorValidacion";
    }
}