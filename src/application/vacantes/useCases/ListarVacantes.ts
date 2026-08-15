import { IVacanteRepository } from "../../../domain/vacantes/repositories/IVacanteRepository";

interface ListarVacantesInput {
    ubicacion?: string;
    modalidad?: string;
    pagina?: number;
    limite?: number;
}

export class ListarVacantes {
    constructor(private readonly vacanteRepository: IVacanteRepository) {}

    async ejecutar(input: ListarVacantesInput) {
        // Reglas de negocio simples: pagina minima 1, limite entre 1 y 100
        // (evita que alguien pida limite=999999 y tumbe la base de datos).
        const pagina = input.pagina && input.pagina > 0 ? input.pagina : 1;
        const limite =
            input.limite && input.limite > 0 && input.limite <= 100
                ? input.limite
                : 20;

        const { vacantes, total } = await this.vacanteRepository.listar({
            ubicacion: input.ubicacion,
            modalidad: input.modalidad,
            pagina,
            limite,
        });

        return {
            vacantes,
            total,
            pagina,
            totalPaginas: Math.max(Math.ceil(total / limite), 1),
        };
    }
}