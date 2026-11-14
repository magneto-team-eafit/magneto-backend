import { PrismaPostulacionRepository } from '../../infrastructure/repositories/PrismaPostulacionRepository';
import { esEstadoValido } from '../../domain/postulaciones/estados';
import { ErrorEstadoInvalido } from '../../domain/postulaciones/errors/ErrorEstadoInvalido';
import { ErrorPostulacionNoEncontrada } from '../../domain/postulaciones/errors/ErrorPostulacionNoEncontrada';

export class PostulacionUseCase {
  constructor(private repo: PrismaPostulacionRepository) {}

  async postularUsuario(usuarioId: string, vacanteId: string) {
    return await this.repo.crear(usuarioId, vacanteId);
  }

  async listarPostulaciones(usuarioId: string) {
    return await this.repo.obtenerPorUsuario(usuarioId);
  }

  // Cambia el estado de una postulacion validando que el estado solicitado sea
  // uno de los permitidos. El registro de actividad y la notificacion los
  // genera el repositorio dentro de la misma transaccion.
  async cambiarEstado(postulacionId: string, nuevoEstado: string) {
    if (!esEstadoValido(nuevoEstado)) {
      throw new ErrorEstadoInvalido(nuevoEstado);
    }
    return await this.repo.cambiarEstado(postulacionId, nuevoEstado);
  }

  async obtenerActividad(postulacionId: string) {
    const postulacion = await this.repo.obtenerPorId(postulacionId);
    if (!postulacion) {
      throw new ErrorPostulacionNoEncontrada();
    }
    return await this.repo.obtenerActividad(postulacionId);
  }

  async listarNotificaciones(usuarioId: string, soloNoLeidas = false) {
    return await this.repo.obtenerNotificaciones(usuarioId, soloNoLeidas);
  }

  async marcarNotificacionLeida(notificacionId: string, usuarioId: string) {
    return await this.repo.marcarNotificacionLeida(notificacionId, usuarioId);
  }
}
