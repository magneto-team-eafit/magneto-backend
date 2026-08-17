import "dotenv/config";
import jwt from "jsonwebtoken";
import { IJwtService } from "../../../domain/perfil/services/IJwtService";

const SECRETO = process.env.JWT_SECRET as string;

export class JwtService implements IJwtService {
  generar(payload: { usuarioId: string }): string {
    // expiresIn: el token deja de ser valido despues de 7 dias,
    // asi el usuario tiene que volver a loguearse eventualmente.
    return jwt.sign(payload, SECRETO, { expiresIn: "7d" });
  }

  verificar(token: string): { usuarioId: string } | null {
    try {
      const decodificado = jwt.verify(token, SECRETO) as { usuarioId: string };
      return decodificado;
    } catch {
      // Si el token esta vencido, mal firmado, o alterado, jwt.verify
      // lanza un error. Lo atrapamos y devolvemos null en vez de
      // dejar que el error se propague.
      return null;
    }
  }
}