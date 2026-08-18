// Puerto: define que necesita el dominio de un repositorio de vacantes,
// sin saber que hay Prisma/PostgreSQL detras.

import { Vacante } from "../entities/Vacante";

export interface FiltrosVacantes {
    ubicacion?: string;
    modalidad?: string;
    pagina: number;
    limite: number;
}

export interface ResultadoVacantes {
    vacantes: Vacante[];
    total: number;
}

export interface IVacanteRepository {
    listar(filtros: FiltrosVacantes): Promise<ResultadoVacantes>;
}