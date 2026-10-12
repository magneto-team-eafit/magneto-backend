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
    // seccion el aporte es proporcional a lo que este lleno.

    calcularDesglose(): DesgloseCompletitud {
        const w = PESOS_COMPLETITUD;

        const datos = [this.nombreCompleto, this.telefono, this.ubicacion, this.resumen];
        const datosLlenos = datos.filter((c) => tieneTexto(c)).length;

        const preferencias = [
            tieneTexto(this.modalidadPreferida),
            this.expectativaSalarial > 0,
            tieneTexto(this.disponibilidad),
        ].filter(Boolean).length;

        const proporcionHabilidades = Math.min(this.habilidades.length, HABILIDADES_PARA_COMPLETAR) / HABILIDADES_PARA_COMPLETAR;

        return {
            datosPersonales: { puntos: redondear2((datosLlenos / datos.length) * w.datosPersonales), maximo: w.datosPersonales },
            experiencia: { puntos: this.experiencias.length > 0 ? w.experiencia : 0, maximo: w.experiencia },
            educacion: { puntos: this.educaciones.length > 0 ? w.educacion : 0, maximo: w.educacion },
            habilidades: { puntos: redondear2(proporcionHabilidades * w.habilidades), maximo: w.habilidades },
            preferencias: { puntos: redondear2((preferencias / 3) * w.preferencias), maximo: w.preferencias },
        };
    }

    calcularCompletitud(): number {
        const d = this.calcularDesglose();
        const total = d.datosPersonales.puntos + d.experiencia.puntos + d.educacion.puntos + d.habilidades.puntos + d.preferencias.puntos;
        return Math.round(total);
    }
}