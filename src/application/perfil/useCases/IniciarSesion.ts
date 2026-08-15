import { IUsuarioRepository } from "../../../domain/perfil/repositories/IUsuarioRepository";
import { IHashService } from "../../../domain/perfil/services/IHashService";
import { IJwtService } from "../../../domain/perfil/services/IJwtService";

interface IniciarSesionInput {
  email: string;
  password: string;
}

interface IniciarSesionOutput {
  token: string;
  usuarioId: string;
  email: string;
}

export class IniciarSesion {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly hashService: IHashService,
    private readonly jwtService: IJwtService
  ) {}

  async ejecutar(input: IniciarSesionInput): Promise<IniciarSesionOutput> {
    const usuario = await this.usuarioRepository.buscarPorEmail(input.email);

    // Mensaje de error IDENTICO tanto si el email no existe como si el
    // password esta mal. Es una practica de seguridad (OWASP)
    if (!usuario) {
      throw new Error("Email o password incorrectos");
    }

    const passwordValido = await this.hashService.comparar(input.password, usuario.passwordHash);
    if (!passwordValido) {
      throw new Error("Email o password incorrectos");
    }

    const token = this.jwtService.generar({ usuarioId: usuario.id });

    return { token, usuarioId: usuario.id, email: usuario.email };
  }
}