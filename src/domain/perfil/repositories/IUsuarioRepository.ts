// Puerto: define que necesita el dominio de un repositorio

import { Usuario } from "../entities/Usuario";

export interface IUsuarioRepository {

    buscarPorEmail(email: string): Promise < Usuario | null >;
    guardar(usuario: Usuario): Promise <void>;
}
