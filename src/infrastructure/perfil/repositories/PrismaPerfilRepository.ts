import { IPerfilRepository } from "../../../domain/perfil/repositories/IPerfilRepository";
import { Perfil } from "../../../domain/perfil/entities/Perfil";
import { prisma } from "../../database/PrismaClient";

export class PrismaPerfilRepository implements IPerfilRepository {
  async buscarPorUsuarioId(usuarioId: string): Promise<Perfil | null> {
    const fila = await prisma.perfil.findUnique({ where: { usuarioId } });

    if (!fila) return null;

    return Perfil.reconstruir({
      id: fila.id,
      usuarioId: fila.usuarioId,
      nombreCompleto: fila.nombreCompleto,
      telefono: fila.telefono,
      ubicacion: fila.ubicacion,
      resumen: fila.resumen,
      modalidadPreferida: fila.modalidadPreferida,
      expectativaSalarial: fila.expectativaSalarial,
      disponibilidad: fila.disponibilidad,
    });
  }

  async guardar(perfil: Perfil): Promise<void> {
    // upsert = "actualiza si existe, crea si no existe".
    // Es exactamente el mismo concepto que un UPSERT/MERGE en SQL.
    await prisma.perfil.upsert({
      where: { usuarioId: perfil.usuarioId },
      update: {
        nombreCompleto: perfil.nombreCompleto,
        telefono: perfil.telefono,
        ubicacion: perfil.ubicacion,
        resumen: perfil.resumen,
        modalidadPreferida: perfil.modalidadPreferida,
        expectativaSalarial: perfil.expectativaSalarial,
        disponibilidad: perfil.disponibilidad,
      },
      create: {
        id: perfil.id,
        usuarioId: perfil.usuarioId,
        nombreCompleto: perfil.nombreCompleto,
        telefono: perfil.telefono,
        ubicacion: perfil.ubicacion,
        resumen: perfil.resumen,
        modalidadPreferida: perfil.modalidadPreferida,
        expectativaSalarial: perfil.expectativaSalarial,
        disponibilidad: perfil.disponibilidad,
      },
    });
  }
}