// Puerto: define que necesita la capa de aplicacion de un repositorio de
// postulaciones, sin saber que hay Prisma/PostgreSQL detras. Asi la capa de
// aplicacion depende de esta interfaz (dominio) y no de la implementacion.

import { EstadoPostulacion } from "../estados";

export interface VacanteResumen {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string | null;
  modalidad: string | null;
  nivelExperiencia: string | null;
}

export interface Postulacion {
  id: string;
  usuarioId: string;
  vacanteId: string;
  estado: string;
  createdAt: Date;
  updatedAt: Date;
  vacante?: VacanteResumen;
}

export interface RegistroActividad {
  id: string;
  postulacionId: string;
  tipo: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  descripcion: string;
  createdAt: Date;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: Date;
}

// Conteo de postulaciones por cada estado posible.
export type ConteoPorEstado = Record<EstadoPostulacion, number>;

export interface IPostulacionRepository {
  crear(usuarioId: string, vacanteId: string): Promise<Postulacion>;

  obtenerPorUsuario(usuarioId: string): Promise<Postulacion[]>;

  obtenerPorId(id: string): Promise<Postulacion | null>;

  cambiarEstado(id: string, nuevoEstado: EstadoPostulacion): Promise<Postulacion>;

  obtenerActividad(postulacionId: string): Promise<RegistroActividad[]>;

  // Conteo de postulaciones del usuario agrupado por estado (para el resumen).
  contarPorEstado(usuarioId: string): Promise<ConteoPorEstado>;

  obtenerNotificaciones(usuarioId: string, soloNoLeidas?: boolean): Promise<Notificacion[]>;

  // Marca como leida solo si la notificacion pertenece al usuario; devuelve
  // true si se actualizo alguna fila.
  marcarNotificacionLeida(id: string, usuarioId: string): Promise<boolean>;
}
