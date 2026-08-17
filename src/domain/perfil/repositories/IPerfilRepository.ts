import { Perfil } from "../entities/Perfil";

export interface IPerfilRepository {
  buscarPorUsuarioId(usuarioId: string): Promise<Perfil | null>;
  guardar(perfil: Perfil): Promise<void>;
}