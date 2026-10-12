import { IPerfilRepository } from "../../../domain/perfil/repositories/IPerfilRepository";
import { Perfil, ExperienciaItem, EducacionItem } from "../../../domain/perfil/entities/Perfil";
import { prisma } from "../../database/PrismaClient";

export class PrismaPerfilRepository implements IPerfilRepository {
  async buscarPorUsuarioId(usuarioId: string): Promise<Perfil | null> {
    // include = JOIN con las tablas hijas, para traer todo en una consulta.
    const fila = await prisma.perfil.findUnique({
      where: { usuarioId },
      include: {
        experiencias: { orderBy: [{ fechaInicio: "desc" }, { createdAt: "asc" }] },
        educaciones: { orderBy: [{ fechaInicio: "desc" }, { createdAt: "asc" }] },
        habilidades: { orderBy: { nombre: "asc" } },
      },
    });

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
      experiencias: fila.experiencias.map((e) => ({
        empresa: e.empresa,
        cargo: e.cargo,
        descripcion: e.descripcion,
        fechaInicio: e.fechaInicio,
        fechaFin: e.fechaFin,
      })),
      educaciones: fila.educaciones.map((e) => ({
        institucion: e.institucion,
        titulo: e.titulo,
        nivel: e.nivel,
        fechaInicio: e.fechaInicio,
        fechaFin: e.fechaFin,
      })),
      habilidades: fila.habilidades.map((h) => h.nombre),
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

  // $transaction([...]) ejecuta las dos operaciones como una sola unidad:
  // o se hacen las dos o no se hace ninguna (como BEGIN ... COMMIT en SQL).
  async reemplazarExperiencias(perfilId: string, items: ExperienciaItem[]): Promise<void> {
    await prisma.$transaction([
      prisma.experiencia.deleteMany({ where: { perfilId } }),
      prisma.experiencia.createMany({ data: items.map((e) => ({ perfilId, ...e })) }),
    ]);
  }

  async reemplazarEducaciones(perfilId: string, items: EducacionItem[]): Promise<void> {
    await prisma.$transaction([
      prisma.educacion.deleteMany({ where: { perfilId } }),
      prisma.educacion.createMany({ data: items.map((e) => ({ perfilId, ...e })) }),
    ]);
  }

  async reemplazarHabilidades(perfilId: string, nombres: string[]): Promise<void> {
    await prisma.$transaction([
      prisma.habilidad.deleteMany({ where: { perfilId } }),
      prisma.habilidad.createMany({ data: nombres.map((nombre) => ({ perfilId, nombre })) }),
    ]);
  }
}