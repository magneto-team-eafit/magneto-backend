import { Request, Response } from "express";
import { RegistrarUsuario } from "../../../application/perfil/useCases/RegistrarUsuario";
import { PrismaUsuarioRepository } from "../../../infrastructure/perfil/repositories/PrismaUsuarioRepository";
import { BcryptHashService } from "../../../infrastructure/perfil/services/BcryptHashService";

// Aqui se "arman" las piezas: le pasamos la implementacion REAL
// (Prisma, bcrypt) al caso de uso, que solo conoce las interfaces.
const usuarioRepository = new PrismaUsuarioRepository();
const hashService = new BcryptHashService();
const registrarUsuario = new RegistrarUsuario(usuarioRepository, hashService);

export class AuthController {
  // Los controladores son el "traductor" entre HTTP y el caso de uso.
  // Leen el request, llaman al caso de uso, y devuelven una respuesta HTTP.
  static async registrar(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validacion basica de entrada (seguridad OWASP: nunca confiar
      // en los datos que llegan del cliente sin revisarlos primero).
      if (!email || !password) {
        res.status(400).json({ error: "El email y el password son obligatorios" });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: "El password debe tener al menos 8 caracteres" });
        return;
      }

      const usuario = await registrarUsuario.ejecutar({ email, password });

      // 201 = "Created". Nunca devolvemos el passwordHash al cliente,
      // aunque este hasheado -- no tiene por que salir del servidor.
      res.status(201).json({
        id: usuario.id,
        email: usuario.email,
        createdAt: usuario.createdAt,
      });
    } catch (error) {
      // Si el caso de uso lanzo el error "Ya existe un usuario...",
      // lo capturamos aqui y lo convertimos en una respuesta HTTP.
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}