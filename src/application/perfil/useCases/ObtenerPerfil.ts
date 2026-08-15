import { Perfil } from "../../../domain//perfil/entities/Perfil";
import { IPerfilRepository } from "../../../domain/perfil/repositories/IPerfilRepository"; 

export class ObtenerPerfil {
    constructor(private readonly perfilRepository: IPerfilRepository) {}

    async ejecutar(usuarioId: string): Promise<Perfil | null> {
        return this.perfilRepository.buscarPorUsuarioId(usuarioId);
    }
}
