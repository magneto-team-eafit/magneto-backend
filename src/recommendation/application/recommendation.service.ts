import { Prisma } from "@prisma/client";
import { armarConsultaTexto, calcularScore, esRelevante } from "./scoring.service";
import { RecomendacionResultado } from "../domain/recommendation.types";
import { prisma } from "../../infrastructure/database/PrismaClient";
import { buscarVacantesCandidatas } from "../infrastructure/vacantesCandidatas";

const MAX_RECOMENDACIONES = 20;
// Solo guardamos las mejores en el historial, y no mas de una vez cada pocos
// minutos: antes cada refresco de la pagina insertaba 50 filas repetidas.
const MAX_GUARDADAS_EN_HISTORIAL = 10;
const MINUTOS_ENTRE_REGISTROS = 10;

export async function obtenerRecomendacionesPorUsuarioId(
  usuarioId: string,
): Promise<RecomendacionResultado[]> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      perfil: {
        include: { educaciones: true, experiencias: true, habilidades: true },
      },
    },
  });

  if (!usuario || !usuario.perfil) {
    throw new Error("El usuario o su perfil no existe.");
  }

  const perfil = usuario.perfil;
  const habilidades = perfil.habilidades.map((h) => h.nombre);

  const titulosEdu = perfil.educaciones.map((e) => `${e.titulo} ${e.institucion}`).join(" ");
  const cargosExp = perfil.experiencias
    .map((e) => `${e.cargo} ${e.empresa} ${e.descripcion || ""}`)
    .join(" ");
  const textoPerfil = `${perfil.resumen} ${titulosEdu} ${cargosExp}`;

  const datosUsuario = {
    ubicacion: perfil.ubicacion,
    modalidadPreferida: perfil.modalidadPreferida,
    habilidades,
    textoPerfil,
  };

  const vacantes = await buscarVacantesCandidatas({
    usuarioId,
    consultaTexto: armarConsultaTexto(habilidades, textoPerfil),
    ubicacion: perfil.ubicacion,
  });

  const recomendaciones: RecomendacionResultado[] = vacantes
    .map((vacante) => {
      const r = calcularScore(datosUsuario, {
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
        score: r.score,
        desglose: r.desglose,
        motivos: r.motivos,
      };
    })
    .filter((r) => esRelevante(r.desglose))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RECOMENDACIONES);

  await guardarEnHistorial(usuarioId, recomendaciones);
  return recomendaciones;
}

async function guardarEnHistorial(usuarioId: string, recomendaciones: RecomendacionResultado[]) {
  if (recomendaciones.length === 0) return;

  const desde = new Date(Date.now() - MINUTOS_ENTRE_REGISTROS * 60 * 1000);
  const reciente = await prisma.historialRecomendacion.findFirst({
    where: { usuarioId, createdAt: { gte: desde } },
    select: { id: true },
  });
  if (reciente) return;

  await prisma.historialRecomendacion.createMany({
    data: recomendaciones.slice(0, MAX_GUARDADAS_EN_HISTORIAL).map((r) => ({
      usuarioId,
      vacanteId: r.vacanteId,
      score: r.score,
      desglose: r.desglose as unknown as Prisma.InputJsonValue,
      motivos: r.motivos as unknown as Prisma.InputJsonValue,
    })),
  });
}

export async function obtenerHistorialPorUsuarioId(usuarioId: string) {
  return prisma.historialRecomendacion.findMany({
    where: { usuarioId },
    include: {
      vacante: {
        select: { titulo: true, empresa: true, ubicacion: true, modalidad: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
