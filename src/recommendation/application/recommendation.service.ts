import { PrismaClient } from '@prisma/client';
import { calcularScore } from './scoring.service';
import { RecomendacionResultado } from '../domain/recommendation.types';

const prisma = new PrismaClient();

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
    throw new Error('El usuario o su perfil no existe');
  }

  const { perfil } = usuario;

  // Concatenar textos relevantes del perfil para el extractor de palabras clave
  const titulosEdu = perfil.educaciones.map(e => `${e.titulo} ${e.institucion}`).join(' ');
  const cargosExp = perfil.experiencias.map(e => `${e.cargo} ${e.empresa} ${e.descripcion || ''}`).join(' ');
  const textoPerfil = `${perfil.resumen} ${titulosEdu} ${cargosExp}`;

  const datosUsuarioScoring = {
    ubicacion: perfil.ubicacion,
    modalidadPreferida: perfil.modalidadPreferida,
    textoPerfil
  };

  // 2. Obtener vacantes registradas en la base de datos
  const vacantes = await prisma.vacante.findMany({
    take: 50 // Limitamos la muestra inicial para optimizar el baseline
  });

  // 3. Calcular score y ranking
  const recomendaciones = vacantes.map(vacante => {
    const resultadoScoring = calcularScore(datosUsuarioScoring, {
      id: vacante.id,
      titulo: vacante.titulo,
      empresa: vacante.empresa,
      ubicacion: vacante.ubicacion,
      modalidad: vacante.modalidad,
      descripcion: vacante.descripcion
    });

    return {
      vacanteId: vacante.id,
      titulo: vacante.titulo,
      empresa: vacante.empresa,
      ubicacion: vacante.ubicacion,
      modalidad: vacante.modalidad,
      score: resultadoScoring.score,
      desglose: resultadoScoring.desglose
    };
  });

  // 4. Ordenar de mayor a menor score
  recomendaciones.sort((a, b) => b.score - a.score);

  return recomendaciones;
}
