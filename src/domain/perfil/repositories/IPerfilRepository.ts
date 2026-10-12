import { Perfil, ExperienciaItem, EducacionItem } from "../entities/Perfil";

export interface IPerfilRepository {
  buscarPorUsuarioId(usuarioId: string): Promise<Perfil | null>;

  // Guarda solo los campos propios del perfil (no las listas).
  guardar(perfil: Perfil): Promise<void>;

  // Cada lista se reemplaza completa: se borran las filas anteriores y se
  // insertan las nuevas, todo en una sola transaccion (como un DELETE
  // seguido de un INSERT dentro de un BEGIN ... COMMIT).
  reemplazarExperiencias(perfilId: string, items: ExperienciaItem[]): Promise<void>;
  reemplazarEducaciones(perfilId: string, items: EducacionItem[]): Promise<void>;
  reemplazarHabilidades(perfilId: string, nombres: string[]): Promise<void>;
}