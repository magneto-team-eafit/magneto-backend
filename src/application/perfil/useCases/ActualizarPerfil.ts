import { randomUUID } from "crypto";
import { Perfil } from "../../../domain/perfil/entities/Perfil";
import { IPerfilRepository } from "../../../domain/perfil/repositories/IPerfilRepository";
interface ActualizarPerfilInput {
  usuarioId: string;
  nombreCompleto: string;
  telefono?: string;
  ubicacion?: string;
  resumen?: string;
  modalidadPreferida?: string;
  expectativaSalarial?: number;
  disponibilidad?: string;
}

export class ActualizarPerfil {
  constructor(private readonly perfilRepository: IPerfilRepository) {}

  async ejecutar(input: ActualizarPerfilInput): Promise<Perfil> {
    let perfil = await this.perfilRepository.buscarPorUsuarioId(input.usuarioId);

    if (!perfil) {
      // Primera vez que este usuario llena su perfil: se crea.
      perfil = Perfil.crear({
        id: randomUUID(),
        usuarioId: input.usuarioId,
        nombreCompleto: input.nombreCompleto,
      });
    }

    // Actualizamos los campos que vengan en el input (edicion).
    perfil.nombreCompleto = input.nombreCompleto;
    if (input.telefono !== undefined) perfil.telefono = input.telefono;
    if (input.ubicacion !== undefined) perfil.ubicacion = input.ubicacion;
    if (input.resumen !== undefined) perfil.resumen = input.resumen;
    if (input.modalidadPreferida !== undefined) perfil.modalidadPreferida = input.modalidadPreferida;
    if (input.expectativaSalarial !== undefined) perfil.expectativaSalarial = input.expectativaSalarial;
    if (input.disponibilidad !== undefined) perfil.disponibilidad = input.disponibilidad;

    await this.perfilRepository.guardar(perfil);

    return perfil;
  }
}