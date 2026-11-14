// Entidad de dominio: representa el concepto de Perfil en el negocio.

// Elementos de lista del perfil: cada uno es una fila de una tabla hija
// (experiencias, educaciones). No tienen vida propia fuera del Perfil.
export interface ExperienciaItem {
    empresa: string;
    cargo: string;
    descripcion: string | null;
    fechaInicio: Date | null;
    fechaFin: Date | null; // null = trabajo actual
}

export interface EducacionItem {
    institucion: string;
    titulo: string;
    nivel: string | null;
    fechaInicio: Date | null;
    fechaFin: Date | null; // null = en curso
}

// Peso de cada seccion en el porcentaje de completitud (suman 100).
export const PESOS_COMPLETITUD = {
    datosPersonales: 20,
    experiencia: 25,
    educacion: 20,
    habilidades: 15,
    preferencias: 20,
} as const;

// Cantidad de habilidades a partir de la cual la seccion cuenta completa.
export const HABILIDADES_PARA_COMPLETAR = 3;

export type SeccionPerfil = keyof typeof PESOS_COMPLETITUD;

export interface AvanceSeccion {
    puntos: number;
    maximo: number;
}

export type DesgloseCompletitud = Record<SeccionPerfil, AvanceSeccion>;

// Una sugerencia le dice al usuario que le falta para subir su completitud.
// Hay una por seccion incompleta.
export interface SugerenciaPerfil {
    seccion: SeccionPerfil;
    titulo: string;
    detalle: string;
    faltantes: string[]; // lo que falta, en palabras ("telefono", "ubicacion"...)
    puntos: number; // porcentaje que suma completar la seccion
}

export function desgloseVacio(): DesgloseCompletitud {
    return {
        datosPersonales: { puntos: 0, maximo: PESOS_COMPLETITUD.datosPersonales },
        experiencia: { puntos: 0, maximo: PESOS_COMPLETITUD.experiencia },
        educacion: { puntos: 0, maximo: PESOS_COMPLETITUD.educacion },
        habilidades: { puntos: 0, maximo: PESOS_COMPLETITUD.habilidades },
        preferencias: { puntos: 0, maximo: PESOS_COMPLETITUD.preferencias },
    };
}

function tieneTexto(valor: string | null): boolean {
    return valor !== null && valor.trim() !== "";
}

function redondear2(n: number): number {
    return Math.round(n * 100) / 100;
}

// ["a"] -> "a" | ["a", "b"] -> "a y b" | ["a", "b", "c"] -> "a, b y c"
function unirLista(items: string[]): string {
    if (items.length <= 1) return items.join("");
    return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

export class Perfil {
    private constructor(
        public readonly id: string,
        public readonly usuarioId: string,
        public nombreCompleto: string,
        public telefono: string | null,
        public ubicacion: string | null,
        public resumen: string,
        public modalidadPreferida: string,
        public expectativaSalarial: number,
        public disponibilidad: string,
        public experiencias: ExperienciaItem[],
        public educaciones: EducacionItem[],
        public habilidades: string[]
    ) {}

    // Cuando se crea un perfil nuevo, los campos opcionales empiezan vacios,
    // porque el usuario los va a ir llenando

    static crear(props: { id: string; usuarioId: string; nombreCompleto: string }): Perfil {
        if (props.nombreCompleto.trim().length === 0) {
            throw new Error("El nombre completo no puede estar vacio");
        }
        return new Perfil(props.id, props.usuarioId, props.nombreCompleto, null, null, "", "", 0, "", [], [], []);
    }

    static reconstruir(props: {
        id: string;
        usuarioId: string;
        nombreCompleto: string;
        telefono: string | null;
        ubicacion: string | null;
        resumen: string;
        modalidadPreferida: string;
        expectativaSalarial: number;
        disponibilidad: string;
        experiencias?: ExperienciaItem[];
        educaciones?: EducacionItem[];
        habilidades?: string[];
    }): Perfil {
        return new Perfil(
            props.id,
            props.usuarioId,
            props.nombreCompleto,
            props.telefono,
            props.ubicacion,
            props.resumen,
            props.modalidadPreferida,
            props.expectativaSalarial,
            props.disponibilidad,
            props.experiencias ?? [],
            props.educaciones ?? [],
            props.habilidades ?? []
        );
    }

    // ---- Cambios por paso del wizard (los datos ya vienen validados) ----

    actualizarDatosPersonales(datos: { nombreCompleto: string; telefono: string; ubicacion: string; resumen: string }): void {
        this.nombreCompleto = datos.nombreCompleto;
        this.telefono = datos.telefono;
        this.ubicacion = datos.ubicacion;
        this.resumen = datos.resumen;
    }

    actualizarPreferencias(datos: { modalidadPreferida: string; expectativaSalarial: number; disponibilidad: string }): void {
        this.modalidadPreferida = datos.modalidadPreferida;
        this.expectativaSalarial = datos.expectativaSalarial;
        this.disponibilidad = datos.disponibilidad;
    }

    reemplazarExperiencias(items: ExperienciaItem[]): void {
        this.experiencias = items;
    }

    reemplazarEducaciones(items: EducacionItem[]): void {
        this.educaciones = items;
    }

    reemplazarHabilidades(nombres: string[]): void {
        this.habilidades = nombres;
    }

    // ---- Regla de negocio: completitud del perfil ----
    // Cada seccion aporta sus puntos (ver PESOS_COMPLETITUD). Dentro de una
    // seccion el aporte es proporcional a lo que este lleno. Las listas de
    // "faltantes" son la unica fuente de verdad: de ellas salen tanto los
    // puntos como las sugerencias.

    private faltantesDatosPersonales(): string[] {
        const faltantes: string[] = [];
        if (!tieneTexto(this.nombreCompleto)) faltantes.push("nombre completo");
        if (!tieneTexto(this.telefono)) faltantes.push("teléfono");
        if (!tieneTexto(this.ubicacion)) faltantes.push("ubicación");
        if (!tieneTexto(this.resumen)) faltantes.push("resumen profesional");
        return faltantes;
    }

    private faltantesPreferencias(): string[] {
        const faltantes: string[] = [];
        if (!tieneTexto(this.modalidadPreferida)) faltantes.push("modalidad preferida");
        if (!(this.expectativaSalarial > 0)) faltantes.push("aspiración salarial");
        if (!tieneTexto(this.disponibilidad)) faltantes.push("disponibilidad");
        return faltantes;
    }

    calcularDesglose(): DesgloseCompletitud {
        const w = PESOS_COMPLETITUD;

        const datosLlenos = 4 - this.faltantesDatosPersonales().length;
        const preferenciasLlenas = 3 - this.faltantesPreferencias().length;
        const proporcionHabilidades = Math.min(this.habilidades.length, HABILIDADES_PARA_COMPLETAR) / HABILIDADES_PARA_COMPLETAR;

        return {
            datosPersonales: { puntos: redondear2((datosLlenos / 4) * w.datosPersonales), maximo: w.datosPersonales },
            experiencia: { puntos: this.experiencias.length > 0 ? w.experiencia : 0, maximo: w.experiencia },
            educacion: { puntos: this.educaciones.length > 0 ? w.educacion : 0, maximo: w.educacion },
            habilidades: { puntos: redondear2(proporcionHabilidades * w.habilidades), maximo: w.habilidades },
            preferencias: { puntos: redondear2((preferenciasLlenas / 3) * w.preferencias), maximo: w.preferencias },
        };
    }

    calcularCompletitud(): number {
        const d = this.calcularDesglose();
        const total = d.datosPersonales.puntos + d.experiencia.puntos + d.educacion.puntos + d.habilidades.puntos + d.preferencias.puntos;
        return Math.round(total);
    }

    // Sugerencias para subir la completitud, de la que mas suma a la que menos.
    // Si el perfil esta completo, la lista queda vacia.
    calcularSugerencias(): SugerenciaPerfil[] {
        const desglose = this.calcularDesglose();
        const sugerencias: SugerenciaPerfil[] = [];

        const agregar = (seccion: SeccionPerfil, titulo: string, detalle: string, faltantes: string[]) => {
            const puntos = redondear2(desglose[seccion].maximo - desglose[seccion].puntos);
            if (puntos > 0) sugerencias.push({ seccion, titulo, detalle, faltantes, puntos });
        };

        const datos = this.faltantesDatosPersonales();
        if (datos.length > 0) {
            agregar("datosPersonales", "Completa tus datos personales", `Te falta agregar ${unirLista(datos)}.`, datos);
        }

        if (this.experiencias.length === 0) {
            agregar(
                "experiencia",
                "Agrega tu experiencia laboral",
                "Registra al menos un cargo. Si aún no tienes empleo formal, cuenta prácticas o trabajos por proyecto.",
                ["experiencia laboral"]
            );
        }

        if (this.educaciones.length === 0) {
            agregar(
                "educacion",
                "Agrega tu formación académica",
                "Registra al menos un estudio: carrera, tecnología, curso o bachillerato.",
                ["formación académica"]
            );
        }

        const habilidadesFaltantes = HABILIDADES_PARA_COMPLETAR - this.habilidades.length;
        if (habilidadesFaltantes > 0) {
            const ningunaAun = this.habilidades.length === 0;
            const detalle = ningunaAun
                ? `Agrega al menos ${HABILIDADES_PARA_COMPLETAR} habilidades para completar esta sección.`
                : `Te ${habilidadesFaltantes === 1 ? "falta 1 habilidad" : `faltan ${habilidadesFaltantes} habilidades`} para llegar a ${HABILIDADES_PARA_COMPLETAR}.`;
            agregar(
                "habilidades",
                ningunaAun ? "Agrega tus habilidades" : "Agrega más habilidades",
                detalle,
                [habilidadesFaltantes === 1 ? "1 habilidad" : `${habilidadesFaltantes} habilidades`]
            );
        }

        const preferencias = this.faltantesPreferencias();
        if (preferencias.length > 0) {
            agregar("preferencias", "Completa tus preferencias laborales", `Te falta indicar ${unirLista(preferencias)}.`, preferencias);
        }

        // sort es estable: a igual puntaje se conserva el orden de las secciones.
        return sugerencias.sort((a, b) => b.puntos - a.puntos);
    }
}