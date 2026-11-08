import { randomUUID } from "crypto";
import { Usuario } from "../../../domain/perfil/entities/Usuario";
import { IUsuarioRepository } from "../../../domain/perfil/repositories/IUsuarioRepository";
import { IHashService } from "../../../domain/perfil/services/IHashService";
import { ErrorValidacion } from "../../../domain/perfil/errors/ErrorValidacion";
import { ErrorUsuarioYaExiste } from "../../../domain/perfil/errors/ErrorUsuarioYaExiste";
import { validarCredencialesRegistro } from "../../../domain/perfil/validation/validacionCredenciales";

export class RegistrarUsuario {
  // Recibe los "puertos" por el constructor, no crea sus propias
  // dependencias. Esto se llama inyeccion de dependencias.
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly hashService: IHashService
  ) {}

  // "input" llega tal cual del cliente (tipo desconocido): aqui se valida
  // y se normaliza antes de usarlo.
  async ejecutar(input: unknown): Promise<Usuario> {
    const { email, password, errores } = validarCredencialesRegistro(input);
    if (Object.keys(errores).length > 0) {
      throw new ErrorValidacion(errores);
    }

    const existente = await this.usuarioRepository.buscarPorEmail(email);
    if (existente) {
      throw new ErrorUsuarioYaExiste();
    }

    const passwordHash = await this.hashService.hashear(password);

    const usuario = Usuario.crear({
      id: randomUUID(),
      email,
      passwordHash,
    });

    await this.usuarioRepository.guardar(usuario);

    return usuario;
  }
}