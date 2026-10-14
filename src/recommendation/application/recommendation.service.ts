import { Prisma } from "@prisma/client";
import { calcularScore } from './scoring.service';
import { RecomendacionResultado } from '../domain/recommendation.types';
import { prisma } from '../../infrastructure/database/PrismaClient';

export async function obtenerRecomendacionesPorUsuarioId(
  usuarioId: string
): Promise<RecomendacionResultado[]> {
  // 1. Obtener perfil completo del usuario desde PostgreSQL
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      perfil: {
        include: {
          educaciones: true,
          experiencias: true
        }
      }
    }
  });

  if (!usuario || !usuario.perfil) {
    throw new Error("El usuario o su perfil no existe.");
  }

  const perfil = usuario.perfil;

  const titulosEdu = perfil.educaciones
    .map((e) => `${e.titulo} ${e.institucion}`)
    .join(" ");

  const cargosExp = perfil.experiencias
    .map((e) => `${e.cargo} ${e.empresa} ${e.descripcion || ""}`)
    .join(" ");

  const datosUsuario = {
    ubicacion: perfil.ubicacion,
    modalidadPreferida: perfil.modalidadPreferida,
    textoPerfil: `${perfil.resumen} ${titulosEdu} ${cargosExp}`,
  };

  const vacantes = await prisma.vacante.findMany({
    where: {
      postulaciones: {
        none: {
          usuarioId,
          estado: "DESCARTADO",
        },
      },
    },
    take: 50,
  });

  const recomendaciones: RecomendacionResultado[] = vacantes
    .map((vacante) => {
      const resultado = calcularScore(datosUsuario, {
        id: vacante.id,
        titulo: vacante.titulo,
        empresa: vacante.empresa,
        ubicacion: vacante.ubicacion,
        modalidad: vacante.modalidad,
        descripcion: vacante.descripcion,
      });

      return {
        vacanteId: vacante.id,
        titulo: vacante.titulo,
        empresa: vacante.empresa,
        ubicacion: vacante.ubicacion,
        modalidad: vacante.modalidad,
        score: resultado.score,
        desglose: resultado.desglose,
        motivos: resultado.motivos,
      };
    })
    .sort((a, b) => b.score - a.score);

  if (recomendaciones.length > 0) {
    await prisma.historialRecomendacion.createMany({
      data: recomendaciones.map((r) => ({
        usuarioId,
        vacanteId: r.vacanteId,
        score: r.score,
        desglose: r.desglose as unknown as Prisma.InputJsonValue,
        motivos: r.motivos as unknown as Prisma.InputJsonValue,
      })),
    });
  }

  return recomendaciones;
}

export async function obtenerHistorialPorUsuarioId(usuarioId: string) {
  return prisma.historialRecomendacion.findMany({
    where: { usuarioId },
    include: {
      vacante: {
        select: {
          titulo: true,
          empresa: true,
          ubicacion: true,
          modalidad: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}