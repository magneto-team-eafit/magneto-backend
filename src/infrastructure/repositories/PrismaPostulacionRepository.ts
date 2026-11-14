import { Prisma } from '@prisma/client';
import { prisma } from '../database/PrismaClient';
import { ESTADOS_POSTULACION, EstadoPostulacion, ETIQUETA_ESTADO } from '../../domain/postulaciones/estados';
import {
  IPostulacionRepository,
  Postulacion,
  RegistroActividad,
  Notificacion,
  ConteoPorEstado,
} from '../../domain/postulaciones/repositories/IPostulacionRepository';
import { ErrorPostulacionDuplicada } from '../../domain/postulaciones/errors/ErrorPostulacionDuplicada';
import { ErrorPostulacionNoEncontrada } from '../../domain/postulaciones/errors/ErrorPostulacionNoEncontrada';
import { ErrorRecursoNoEncontrado } from '../../domain/postulaciones/errors/ErrorRecursoNoEncontrado';

export class PrismaPostulacionRepository implements IPostulacionRepository {
  async crear(usuarioId: string, vacanteId: string): Promise<Postulacion> {
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

        return postulacion as Postulacion;
      });
    } catch (error) {
      // P2002 = violacion de una restriccion unica. Aqui solo puede venir del
      // indice (usuarioId, vacanteId), es decir, una postulacion repetida.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ErrorPostulacionDuplicada();
      }
      // P2003 = violacion de clave foranea: el usuarioId o el vacanteId no
      // existen. Se traduce a "recurso no encontrado" (404) en vez de 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ErrorRecursoNoEncontrado('El usuario o la vacante');
      }
      throw error;
    }
  }

  async obtenerPorUsuario(usuarioId: string): Promise<Postulacion[]> {
    return (await prisma.postulacion.findMany({
      where: { usuarioId },
      include: {
        vacante: true,
      },
      orderBy: { createdAt: 'desc' },
    })) as Postulacion[];
  }

  async obtenerPorId(id: string): Promise<Postulacion | null> {
    return (await prisma.postulacion.findUnique({
      where: { id },
      include: { vacante: true },
    })) as Postulacion | null;
  }

  // Cambia el estado de una postulacion y, en la misma transaccion, deja un
  // registro de actividad y crea una notificacion para el usuario.
  async cambiarEstado(id: string, nuevoEstado: EstadoPostulacion): Promise<Postulacion> {
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

      return postulacion as Postulacion;
    });
  }

  async obtenerActividad(postulacionId: string): Promise<RegistroActividad[]> {
    return (await prisma.registroActividad.findMany({
      where: { postulacionId },
      orderBy: { createdAt: 'desc' },
    })) as RegistroActividad[];
  }

  async contarPorEstado(usuarioId: string): Promise<ConteoPorEstado> {
    const filas = await prisma.postulacion.groupBy({
      by: ['estado'],
      where: { usuarioId },
      _count: { _all: true },
    });

    // Partimos de todos los estados en 0 para que el resumen siempre tenga la
    // forma completa, aunque el usuario no tenga postulaciones en algun estado.
    const conteo = Object.fromEntries(
      ESTADOS_POSTULACION.map((estado) => [estado, 0])
    ) as ConteoPorEstado;

    for (const fila of filas) {
      if ((ESTADOS_POSTULACION as readonly string[]).includes(fila.estado)) {
        conteo[fila.estado as EstadoPostulacion] = fila._count._all;
      }
    }
    return conteo;
  }

  async obtenerNotificaciones(usuarioId: string, soloNoLeidas = false): Promise<Notificacion[]> {
    return (await prisma.notificacion.findMany({
      where: {
        usuarioId,
        ...(soloNoLeidas ? { leida: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })) as Notificacion[];
  }

  async marcarNotificacionLeida(id: string, usuarioId: string): Promise<boolean> {
    // updateMany con el usuarioId en el where evita que un usuario marque
    // notificaciones que no son suyas; devuelve cuantas filas afecto.
    const resultado = await prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leida: true },
    });
    return resultado.count > 0;
  }
}
