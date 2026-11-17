import { Request, Response, NextFunction } from "express";

// Va DESPUES de authMiddleware. Deja pasar la peticion solo si el usuarioId de
// la URL es el mismo del token: cada quien puede ver unicamente lo suyo.
// Analogia SQL: es como un WHERE usuario_id = <el del token> que se aplica
// a toda la ruta, para que nadie lea las filas de otro cambiando el numero.
export function soloPropietario(req: Request, res: Response, next: NextFunction): void {
    if (req.params.usuarioId !== req.usuarioId) {
        res.status(403).json({ error: "No tienes permiso para ver esta información" });
        return;
    }
    next();
}