// Puerto: define que necesita el dominio de un repositorio de vacantes,
// sin saber que hay Prisma/PostgreSQL detras.

import { Vacante } from "../entities/Vacante";

export interface FiltrosVacantes {
    ubicacion?: string;
    modalidad?: string;
    nivelExperiencia?: string;
    salarioMin?: number;
    salarioMax?: number;
    q?: string; // busqueda full-text sobre titulo + empresa + descripcion
    pagina: number;
    limite: number;
}

export interface ResultadoVacantes {
    vacantes: Vacante[];
    total: number;
}

export interface IVacanteRepository {
    listar(filtros: FiltrosVacantes): Promise<ResultadoVacantes>;
    obtenerPorId(id: string): Promise<Vacante | null>;
}
