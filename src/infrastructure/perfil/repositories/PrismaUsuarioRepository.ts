import { IUsuarioRepository } from "../../../domain/perfil/repositories/IUsuarioRepository";
import { Usuario } from "../../../domain/perfil/entities/Usuario";
import { prisma } from "../../database/PrismaClient";

export class PrismaUsuarioRepository implements IUsuarioRepository {
  async buscarPorEmail(email: string): Promise<Usuario | null> {
    // La busqueda ignora mayusculas y minusculas, para encontrar tambien las
    // cuentas antiguas que se guardaron con el correo escrito de otra forma.
    const fila = await prisma.usuario.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!fila) return null;

    // Convertimos la fila cruda de la base de datos (un objeto plano)
    // en una entidad de dominio real, usando reconstruir (no crear),
    // porque este dato ya existia y ya fue validado antes.
    return Usuario.reconstruir({
      id: fila.id,
      email: fila.email,
      passwordHash: fila.passwordHash,
      createdAt: fila.createdAt,
    });
  }

  async guardar(usuario: Usuario): Promise<void> {
    await prisma.usuario.create({
      data: {
        id: usuario.id,
        email: usuario.email,
        passwordHash: usuario.passwordHash,
      },
    });
  }
}