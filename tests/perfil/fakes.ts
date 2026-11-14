// Dobles de prueba en memoria: reemplazan a la base de datos, a bcrypt y a
// jsonwebtoken para probar los casos de uso sin infraestructura real.

import { EducacionItem, ExperienciaItem, Perfil } from "../../src/domain/perfil/entities/Perfil";
import { Usuario } from "../../src/domain/perfil/entities/Usuario";
import { IUsuarioRepository } from "../../src/domain/perfil/repositories/IUsuarioRepository";
import { IPerfilRepository } from "../../src/domain/perfil/repositories/IPerfilRepository";
import { IHashService } from "../../src/domain/perfil/services/IHashService";
import { IJwtService } from "../../src/domain/perfil/services/IJwtService";

export class UsuarioRepositoryEnMemoria implements IUsuarioRepository {
  usuarios: Usuario[] = [];

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    // Igual que el repositorio real: la busqueda ignora mayusculas.
    return this.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async guardar(usuario: Usuario): Promise<void> {
    this.usuarios.push(usuario);
  }
}

export class HashServiceFalso implements IHashService {
  comparaciones: { texto: string; hash: string }[] = [];

  async hashear(textoPlano: string): Promise<string> {
    return `hash(${textoPlano})`;
  }

  async comparar(textoPlano: string, hash: string): Promise<boolean> {
    this.comparaciones.push({ texto: textoPlano, hash });
    return hash === `hash(${textoPlano})`;
  }
}

export class JwtServiceFalso implements IJwtService {
  generar(payload: { usuarioId: string }): string {
    return `token-de-${payload.usuarioId}`;
  }

  verificar(token: string): { usuarioId: string } | null {
    return token.startsWith("token-de-") ? { usuarioId: token.slice("token-de-".length) } : null;
  }
}

export class PerfilRepositoryEnMemoria implements IPerfilRepository {
  perfiles = new Map<string, Perfil>(); // clave: usuarioId
  // Registro de las operaciones de escritura, para comprobar que se hicieron (o no).
  escrituras: string[] = [];

  async buscarPorUsuarioId(usuarioId: string): Promise<Perfil | null> {
    return this.perfiles.get(usuarioId) ?? null;
  }

  async guardar(perfil: Perfil): Promise<void> {
    this.escrituras.push("guardar");
    this.perfiles.set(perfil.usuarioId, perfil);
  }

  async reemplazarExperiencias(_perfilId: string, _items: ExperienciaItem[]): Promise<void> {
    this.escrituras.push("reemplazarExperiencias");
  }

  async reemplazarEducaciones(_perfilId: string, _items: EducacionItem[]): Promise<void> {
    this.escrituras.push("reemplazarEducaciones");
  }

  async reemplazarHabilidades(_perfilId: string, _nombres: string[]): Promise<void> {
    this.escrituras.push("reemplazarHabilidades");
  }
}