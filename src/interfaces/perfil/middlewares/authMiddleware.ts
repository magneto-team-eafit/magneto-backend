import { Request, Response, NextFunction } from "express";
import { JwtService } from "../../../infrastructure/perfil/services/JwtService";

const jwtService = new JwtService();

// Extendemos el tipo Request de Express para poder guardarle el
// usuarioId despues de validar el token. Sin esto, TypeScript no
// nos dejaria escribir req.usuarioId mas abajo.

declare global {
    namespace Express {
        interface Request {
            usuarioId?: string;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token no proporcionado" });
        return;
    }

    const token = authHeader.replace("Bearer ", "");

    const payload = jwtService.verificar(token);

    if (!payload) {
        res.status(401).json({ error: "Token invalido o expirado" });
        return;
    }

    // Agregamos el usuarioId al request para que el controlador que sigue
    // en la cadena sepa de quien es esta peticion
    req.usuarioId = payload.usuarioId;
     // next() le dije a Express que siga con el siguiente middleware o controlador final.
    next();
}