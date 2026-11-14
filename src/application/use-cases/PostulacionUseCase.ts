import { IPostulacionRepository, Postulacion } from '../../domain/postulaciones/repositories/IPostulacionRepository';
import { ESTADOS_POSTULACION, EstadoPostulacion, esEstadoValido } from '../../domain/postulaciones/estados';
import { ErrorEstadoInvalido } from '../../domain/postulaciones/errors/ErrorEstadoInvalido';
import { ErrorPostulacionNoEncontrada } from '../../domain/postulaciones/errors/ErrorPostulacionNoEncontrada';
import { ErrorAccesoDenegado } from '../../domain/postulaciones/errors/ErrorAccesoDenegado';

export interface ResumenPostulaciones {
  total: number;
  porEstado: Record<EstadoPostulacion, number>;
  // Tasa de avance: proporcion de postulaciones que pasaron de "POSTULADO"
  // (es decir, que avanzaron en el proceso), entre 0 y 1.
  tasaAvance: number;
}

// La capa de aplicacion depende de la INTERFAZ del repositorio (puerto), no de
// la implementacion con Prisma. Esto respeta la Clean Architecture.
export class PostulacionUseCase {
  constructor(private repo: IPostulacionRepository) {}

  async postularUsuario(usuarioId: string, vacanteId: string) {
    return await this.repo.crear(usuarioId, vacanteId);
  }

  async listarPostulaciones(usuarioId: string) {
    return await this.repo.obtenerPorUsuario(usuarioId);
  }

  // Devuelve la postulacion solo si pertenece al usuario; si no, lanza el error
  // correspondiente (404 si no existe, 403 si es de otra persona).
  private async obtenerPropia(postulacionId: string, usuarioId: string): Promise<Postulacion> {
    const postulacion = await this.repo.obtenerPorId(postulacionId);
    if (!postulacion) {
      throw new ErrorPostulacionNoEncontrada();
    }
    if (postulacion.usuarioId !== usuarioId) {
      throw new ErrorAccesoDenegado();
    }
    return postulacion;
  }

  // Cambia el estado validando (1) que el estado sea valido y (2) que la
  // postulacion sea del usuario autenticado.
  async cambiarEstado(postulacionId: string, usuarioId: string, nuevoEstado: string) {
    if (!esEstadoValido(nuevoEstado)) {
      throw new ErrorEstadoInvalido(nuevoEstado);
    }
    await this.obtenerPropia(postulacionId, usuarioId);
    return await this.repo.cambiarEstado(postulacionId, nuevoEstado);
  }

  async obtenerActividad(postulacionId: string, usuarioId: string) {
    await this.obtenerPropia(postulacionId, usuarioId);
    return await this.repo.obtenerActividad(postulacionId);
  }

  // Reporte simple del tablero: total, cantidad por estado y tasa de avance.
  async obtenerResumen(usuarioId: string): Promise<ResumenPostulaciones> {
    const porEstado = await this.repo.contarPorEstado(usuarioId);
    const total = ESTADOS_POSTULACION.reduce((suma, estado) => suma + porEstado[estado], 0);
    // "Avanzaron" = todas menos las que siguen en POSTULADO.
    const avanzadas = total - porEstado.POSTULADO;
    const tasaAvance = total === 0 ? 0 : Number((avanzadas / total).toFixed(2));
    return { total, porEstado, tasaAvance };
  }

  async listarNotificaciones(usuarioId: string, soloNoLeidas = false) {
    return await this.repo.obtenerNotificaciones(usuarioId, soloNoLeidas);
  }

  async marcarNotificacionLeida(notificacionId: string, usuarioId: string) {
    return await this.repo.marcarNotificacionLeida(notificacionId, usuarioId);
  }
}
