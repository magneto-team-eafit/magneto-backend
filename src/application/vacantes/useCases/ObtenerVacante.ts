import { IVacanteRepository } from "../../../domain/vacantes/repositories/IVacanteRepository";

export class ObtenerVacante {
    constructor(private readonly vacanteRepository: IVacanteRepository) {}

    async ejecutar(id: string) {
        const vacante = await this.vacanteRepository.obtenerPorId(id);
        if (!vacante) {
            throw new Error("Vacante no encontrada");
        }
        return vacante;
    }
}
