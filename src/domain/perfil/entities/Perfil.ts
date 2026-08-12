// Entidad de dominio: representa el concepto de Perfil en el negocio.

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
        public disponibilidad: string
    ) {}

    // Cuando se crea un perfil nuevo, los campos opcionales empiezan vacios,
    // porque el usaurio los va a ir llenando

    static crear(props: { id: string; usuarioId: string; nombreCompleto: string }): Perfil {
        if (props.nombreCompleto.trim().length === 0) {
            throw new Error("El nombre completo no puede estar vacio");
        }
        return new Perfil(props.id, props.usuarioId, props.nombreCompleto, null, null, "", "", 0, "");
    }

    static reconstruir (props: {
        id: string;
        usuarioId: string;
        nombreCompleto: string;
        telefono: string | null;
        ubicacion: string | null;
        resumen: string;
        modalidadPreferida: string;
        expectativaSalarial: number;
        disponibilidad: string;
    }): Perfil {
        return new Perfil (
            props.id,
            props.usuarioId,
            props.nombreCompleto,
            props.telefono,
            props.ubicacion,
            props.resumen,
            props.modalidadPreferida,
            props.expectativaSalarial,
            props.disponibilidad
        );
    }

    // Regla de negocio: calcula el porcentaje de completitud del perfcil.
    calcularCompletitud(): number {
        const camposTexto = [this.telefono, this.ubicacion, this.resumen, this.modalidadPreferida, this.disponibilidad];
        const llenos = camposTexto.filter((campo) => campo !== null && campo !== "").length;
        const salarialLleno = this.expectativaSalarial > 0 ? 1 : 0;

        const totalCampos = camposTexto.length + 1;
        const totalLlenos = llenos + salarialLleno;

        return Math.round((totalLlenos / totalCampos) * 100);

    }
}
