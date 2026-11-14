import { Request, Response } from "express";
import { RegistrarUsuario } from "../../../application/perfil/useCases/RegistrarUsuario";
import { PrismaUsuarioRepository } from "../../../infrastructure/perfil/repositories/PrismaUsuarioRepository";
import { BcryptHashService } from "../../../infrastructure/perfil/services/BcryptHashService";
import { IniciarSesion } from "../../../application/perfil/useCases/IniciarSesion";
import { JwtService } from "../../../infrastructure/perfil/services/JwtService";
import { ErrorValidacion } from "../../../domain/perfil/errors/ErrorValidacion";
import { ErrorUsuarioYaExiste } from "../../../domain/perfil/errors/ErrorUsuarioYaExiste";
import { ErrorCredencialesInvalidas } from "../../../domain/perfil/errors/ErrorCredencialesInvalidas";

// Aqui se "arman" las piezas: le pasamos la implementacion REAL
// (Prisma, bcrypt) al caso de uso, que solo conoce las interfaces.
const usuarioRepository = new PrismaUsuarioRepository();
const hashService = new BcryptHashService();
const registrarUsuario = new RegistrarUsuario(usuarioRepository, hashService);
const jwtService = new JwtService();
const iniciarSesion = new IniciarSesion(usuarioRepository, hashService, jwtService);

// Convierte los errores del dominio en respuestas HTTP. Los errores que no
// reconocemos son inesperados (por ejemplo, la base de datos caida): se
// registran en el servidor y al cliente solo le llega un mensaje generico,
// nunca detalles internos (OWASP: no filtrar informacion).
function responderError(error: unknown, res: Response, accion: string): void {
  if (error instanceof ErrorValidacion) {
    const primerMensaje = Object.values(error.detalles)[0] ?? error.message;
    res.status(400).json({ error: primerMensaje, detalles: error.detalles });
    return;
  }
  if (error instanceof ErrorUsuarioYaExiste) {
    res.status(409).json({ error: error.message });
    return;
  }
  if (error instanceof ErrorCredencialesInvalidas) {
    // 401 = "Unauthorized": credenciales invalidas (distinto del 400,
    // que usamos para datos mal formados).
    res.status(401).json({ error: error.message });
    return;
  }
  console.error(`[auth] Error inesperado en ${accion}:`, error);
  res.status(500).json({ error: "Error interno del servidor" });
}

export class AuthController {
  // Los controladores son el "traductor" entre HTTP y el caso de uso.
  static async registrar(req: Request, res: Response): Promise<void> {
    try {
      const usuario = await registrarUsuario.ejecutar(req.body);

      // 201 = "Created". Nunca devolvemos el passwordHash al cliente.
      res.status(201).json({
        id: usuario.id,
        email: usuario.email,
        createdAt: usuario.createdAt,
      });
    } catch (error) {
      responderError(error, res, "registro");
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const resultado = await iniciarSesion.ejecutar(req.body);
      res.status(200).json(resultado);
    } catch (error) {
      responderError(error, res, "login");
    }
  }
}