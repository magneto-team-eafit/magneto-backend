import { Prisma } from '@prisma/client';
import { prisma } from '../database/PrismaClient';
import { EstadoPostulacion, ETIQUETA_ESTADO } from '../../domain/postulaciones/estados';
import { ErrorPostulacionDuplicada } from '../../domain/postulaciones/errors/ErrorPostulacionDuplicada';
import { ErrorPostulacionNoEncontrada } from '../../domain/postulaciones/errors/ErrorPostulacionNoEncontrada';

export class PrismaPostulacionRepository {
  async crear(usuarioId: string, vacanteId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const postulacion = await tx.postulacion.create({
          data: {
            usuarioId,
            vacanteId,
            estado: 'POSTULADO',
          },
          include: {
            vacante: true,
          },
        });

        // Trazabilidad: dejamos registrada la creacion de la postulacion.
        await tx.registroActividad.create({
          data: {
            postulacionId: postulacion.id,
            tipo: 'POSTULACION_CREADA',
            estadoAnterior: null,
            estadoNuevo: 'POSTULADO',
            descripcion: `Te postulaste a "${postulacion.vacante.titulo}".`,
          },
        });

        return postulacion;
      });
    } catch (error) {
      // P2002 = violacion de una restriccion unica. Aqui solo puede venir del
      // indice (usuarioId, vacanteId), es decir, una postulacion repetida.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ErrorPostulacionDuplicada();
      }
      throw error;
    }
  }

  async obtenerPorUsuario(usuarioId: string) {
    return await prisma.postulacion.findMany({
      where: { usuarioId },
      include: {
        vacante: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtenerPorId(id: string) {
    return await prisma.postulacion.findUnique({
      where: { id },
      include: { vacante: true },
    });
  }

  // Cambia el estado de una postulacion y, en la misma transaccion, deja un
  // registro de actividad y crea una notificacion para el usuario.
  async cambiarEstado(id: string, nuevoEstado: EstadoPostulacion) {
    const actual = await prisma.postulacion.findUnique({ where: { id } });
    if (!actual) {
      throw new ErrorPostulacionNoEncontrada();
    }

    const estadoAnterior = actual.estado as EstadoPostulacion;

    return await prisma.$transaction(async (tx) => {
      const postulacion = await tx.postulacion.update({
        where: { id },
        data: { estado: nuevoEstado },
        include: { vacante: true },
      });

      // Si el estado no cambio no generamos ruido (ni actividad ni notificacion).
      if (estadoAnterior !== nuevoEstado) {
        await tx.registroActividad.create({
          data: {
            postulacionId: id,
            tipo: 'CAMBIO_ESTADO',
            estadoAnterior,
            estadoNuevo: nuevoEstado,
            descripcion: `Estado cambiado de "${ETIQUETA_ESTADO[estadoAnterior]}" a "${ETIQUETA_ESTADO[nuevoEstado]}".`,
          },
        });

        await tx.notificacion.create({
          data: {
            usuarioId: postulacion.usuarioId,
            tipo: 'ESTADO_POSTULACION',
            titulo: 'Actualización de tu postulación',
            mensaje: `Tu postulación a "${postulacion.vacante.titulo}" ahora está en estado "${ETIQUETA_ESTADO[nuevoEstado]}".`,
          },
        });
      }

      return postulacion;
    });
  }

  async obtenerActividad(postulacionId: string) {
    return await prisma.registroActividad.findMany({
      where: { postulacionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtenerNotificaciones(usuarioId: string, soloNoLeidas = false) {
    return await prisma.notificacion.findMany({
      where: {
        usuarioId,
        ...(soloNoLeidas ? { leida: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async marcarNotificacionLeida(id: string, usuarioId: string) {
    // updateMany con el usuarioId en el where evita que un usuario marque
    // notificaciones que no son suyas; devuelve cuantas filas afecto.
    const resultado = await prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leida: true },
    });
    return resultado.count > 0;
  }
}
