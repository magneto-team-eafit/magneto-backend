// Entidad de dominio: representa una Vacante (oferta de empleo) en el negocio.
// Sigue el mismo patron que Usuario.ts y Perfil.ts: constructor privado +
// factories estaticas (crear / reconstruir).

export class Vacante {
    private constructor(
        public readonly id: string,
        public readonly titulo: string,
        public readonly empresa: string,
        public readonly ubicacion: string | null,
        public readonly modalidad: string | null,
        public readonly nivelExperiencia: string | null,
        public readonly salarioMin: number | null,
        public readonly salarioMax: number | null,
        public readonly moneda: string | null,
        public readonly descripcion: string,
        public readonly urlOriginal: string | null,
        public readonly fuente: string,
        public readonly fechaPublicacion: Date | null
    ) {}

    // Se usa cuando se crea una vacante nueva a mano (ej. desde un endpoint
    // administrativo). El seed masivo del dataset no pasa por aqui porque
    // no tiene sentido validar fila por fila un CSV de miles de registros;
    // ver prisma/seed-vacantes.ts para esa logica.
    static crear(props: {
        id: string;
        titulo: string;
        empresa: string;
        descripcion: string;
        ubicacion?: string | null;
        modalidad?: string | null;
        nivelExperiencia?: string | null;
        salarioMin?: number | null;
        salarioMax?: number | null;
        moneda?: string | null;
        urlOriginal?: string | null;
        fuente?: string;
        fechaPublicacion?: Date | null;
    }): Vacante {
        if (props.titulo.trim().length === 0) {
            throw new Error("El titulo de la vacante no puede estar vacio");
        }
        if (props.empresa.trim().length === 0) {
            throw new Error("La empresa de la vacante no puede estar vacia");
        }

        return new Vacante(
            props.id,
            props.titulo,
            props.empresa,
            props.ubicacion ?? null,
            props.modalidad ?? null,
            props.nivelExperiencia ?? null,
            props.salarioMin ?? null,
            props.salarioMax ?? null,
            props.moneda ?? null,
            props.descripcion,
            props.urlOriginal ?? null,
            props.fuente ?? "kaggle-linkedin",
            props.fechaPublicacion ?? null
        );
    }

    // Se usa para reconstruir una vacante que ya existe en la base de datos,
    // sin repetir validaciones (mismo criterio que Usuario.reconstruir).
    static reconstruir(props: {
        id: string;
        titulo: string;
        empresa: string;
        ubicacion: string | null;
        modalidad: string | null;
        nivelExperiencia: string | null;
        salarioMin: number | null;
        salarioMax: number | null;
        moneda: string | null;
        descripcion: string;
        urlOriginal: string | null;
        fuente: string;
        fechaPublicacion: Date | null;
    }): Vacante {
        return new Vacante(
            props.id,
            props.titulo,
            props.empresa,
            props.ubicacion,
            props.modalidad,
            props.nivelExperiencia,
            props.salarioMin,
            props.salarioMax,
            props.moneda,
            props.descripcion,
            props.urlOriginal,
            props.fuente,
            props.fechaPublicacion
        );
    }
}