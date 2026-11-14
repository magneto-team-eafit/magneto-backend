import { IUsuarioRepository } from "../../../domain/perfil/repositories/IUsuarioRepository";
import { IHashService } from "../../../domain/perfil/services/IHashService";
import { IJwtService } from "../../../domain/perfil/services/IJwtService";
import { ErrorValidacion } from "../../../domain/perfil/errors/ErrorValidacion";
import { ErrorCredencialesInvalidas } from "../../../domain/perfil/errors/ErrorCredencialesInvalidas";
import { validarCredencialesLogin } from "../../../domain/perfil/validation/validacionCredenciales";

interface IniciarSesionOutput {
  token: string;
  usuarioId: string;
  email: string;
}

// Hash de una contrasena que nadie usa. Cuando el correo no existe se
// compara contra este hash, para que la respuesta tarde lo mismo que con
// un correo real y no se pueda deducir que cuentas existen (OWASP).
const HASH_FALSO = "$2b$10$fyuH/7AkrFV8HgkCvOeRsug3qSf9WtlX/Mgo8twjsVheNEx5gX.rm";

export class IniciarSesion {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly hashService: IHashService,
    private readonly jwtService: IJwtService
  ) {}

  async ejecutar(input: unknown): Promise<IniciarSesionOutput> {
    const { email, password, errores } = validarCredencialesLogin(input);
    if (Object.keys(errores).length > 0) {
      throw new ErrorValidacion(errores);
    }

    const usuario = await this.usuarioRepository.buscarPorEmail(email);

    // Mismo error si el correo no existe o si la contrasena esta mal.
    if (!usuario) {
      await this.hashService.comparar(password, HASH_FALSO);
      throw new ErrorCredencialesInvalidas();
    }

    const passwordValido = await this.hashService.comparar(password, usuario.passwordHash);
    if (!passwordValido) {
      throw new ErrorCredencialesInvalidas();
    }

    const token = this.jwtService.generar({ usuarioId: usuario.id });

    return { token, usuarioId: usuario.id, email: usuario.email };
  }
}