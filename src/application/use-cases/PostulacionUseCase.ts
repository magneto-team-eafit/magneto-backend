import { PrismaPostulacionRepository } from '../../infrastructure/repositories/PrismaPostulacionRepository';

export class PostulacionUseCase {
  constructor(private repo: PrismaPostulacionRepository) {}

  async postularUsuario(usuarioId: string, vacanteId: string) {
    return await this.repo.crear(usuarioId, vacanteId);
  }

  async listarPostulaciones(usuarioId: string) {
    return await this.repo.obtenerPorUsuario(usuarioId);
  }
}
