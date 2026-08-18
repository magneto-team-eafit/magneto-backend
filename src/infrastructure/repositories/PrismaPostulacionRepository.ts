import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PrismaPostulacionRepository {
  async crear(usuarioId: string, vacanteId: string) {
    return await prisma.postulacion.create({
      data: {
        usuarioId,
        vacanteId,
        estado: 'POSTULADO',
      },
      include: {
        vacante: true,
      },
    });
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
}
