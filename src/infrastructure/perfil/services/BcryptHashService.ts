import bcrypt from "bcrypt";
import { IHashService } from "../../../domain/perfil/services/IHashService";

export class BcryptHashService implements IHashService {
  private readonly SALT_ROUNDS = 10;

  async hashear(textoPlano: string): Promise<string> {
    return bcrypt.hash(textoPlano, this.SALT_ROUNDS);
  }

  async comparar(textoPlano: string, hash: string): Promise<boolean> {
    return bcrypt.compare(textoPlano, hash);
  }
}