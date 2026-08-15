import { randomUUID } from "crypto";
import { Usuario } from "../../../domain/perfil/entities/Usuario";
import { IUsuarioRepository } from "../../../domain/perfil/repositories/IUsuarioRepository";
import { IHashService } from "../../../domain/perfil/services/IHashService";

interface RegistrarUsuarioInput {
  email: string;
  password: string;
}

export class RegistrarUsuario {
  // Recibe los "puertos" por el constructor, no crea sus propias
  // dependencias. Esto se llama inyeccion de dependencias.
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly hashService: IHashService
  ) {}

  async ejecutar(input: RegistrarUsuarioInput): Promise<Usuario> {
    const existente = await this.usuarioRepository.buscarPorEmail(input.email);
    if (existente) {
      throw new Error("Ya existe un usuario registrado con este email");
    }

    const passwordHash = await this.hashService.hashear(input.password);

    const usuario = Usuario.crear({
      id: randomUUID(),
      email: input.email,
      passwordHash,
    });

    await this.usuarioRepository.guardar(usuario);

    return usuario;
  }
}