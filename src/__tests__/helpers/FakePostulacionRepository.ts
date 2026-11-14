// Repositorio de postulaciones en memoria para pruebas. Implementa la misma
// interfaz (puerto) que usa la capa de aplicacion, asi que el flujo que se
// prueba es exactamente el que corre en produccion, pero sin base de datos.
//
// Reproduce las reglas clave de la implementacion con Prisma:
// - unico (usuarioId, vacanteId) -> ErrorPostulacionDuplicada
// - al cambiar de estado genera registro de actividad + notificacion
// - la creacion deja un registro de actividad "POSTULACION_CREADA"

import { randomUUID } from "node:crypto";
import {
  ESTADOS_POSTULACION,
  EstadoPostulacion,
  ETIQUETA_ESTADO,
} from "../../domain/postulaciones/estados";
import {
  IPostulacionRepository,
  Postulacion,
  RegistroActividad,
  Notificacion,
  ConteoPorEstado,
} from "../../domain/postulaciones/repositories/IPostulacionRepository";
import { ErrorPostulacionDuplicada } from "../../domain/postulaciones/errors/ErrorPostulacionDuplicada";
import { ErrorPostulacionNoEncontrada } from "../../domain/postulaciones/errors/ErrorPostulacionNoEncontrada";

export class FakePostulacionRepository implements IPostulacionRepository {
  private postulaciones: Postulacion[] = [];
  // Guardamos las actividades/notificaciones con un numero de secuencia para
  // ordenarlas de forma determinista (createdAt puede empatar al milisegundo).
  private actividades: (RegistroActividad & { _seq: number })[] = [];
  private notificaciones: (Notificacion & { _seq: number })[] = [];
  private seq = 0;

  // Catalogo minimo de vacantes para armar el resumen de cada postulacion.
  private vacantes = new Map<string, { titulo: string; empresa: string }>([
    ["vac-1", { titulo: "Backend Node.js", empresa: "Bancolombia" }],
    ["vac-2", { titulo: "Frontend React", empresa: "Rappi" }],
  ]);

  async crear(usuarioId: string, vacanteId: string): Promise<Postulacion> {
    const existe = this.postulaciones.some(
      (p) => p.usuarioId === usuarioId && p.vacanteId === vacanteId
    );
    if (existe) {
      throw new ErrorPostulacionDuplicada();
    }
    const info = this.vacantes.get(vacanteId) ?? { titulo: "Vacante", empresa: "Empresa" };
    const ahora = new Date();
    const postulacion: Postulacion = {
      id: randomUUID(),
      usuarioId,
      vacanteId,
      estado: "POSTULADO",
      createdAt: ahora,
      updatedAt: ahora,
      vacante: {
        id: vacanteId,
        titulo: info.titulo,
        empresa: info.empresa,
        ubicacion: null,
        modalidad: null,
        nivelExperiencia: null,
      },
    };
    this.postulaciones.push(postulacion);
    this.actividades.push({
      id: randomUUID(),
      postulacionId: postulacion.id,
      tipo: "POSTULACION_CREADA",
      estadoAnterior: null,
      estadoNuevo: "POSTULADO",
      descripcion: `Te postulaste a "${info.titulo}".`,
      createdAt: ahora,
      _seq: this.seq++,
    });
    return postulacion;
  }

  async obtenerPorUsuario(usuarioId: string): Promise<Postulacion[]> {
    return this.postulaciones.filter((p) => p.usuarioId === usuarioId);
  }

  async obtenerPorId(id: string): Promise<Postulacion | null> {
    return this.postulaciones.find((p) => p.id === id) ?? null;
  }

  async cambiarEstado(id: string, nuevoEstado: EstadoPostulacion): Promise<Postulacion> {
    const postulacion = this.postulaciones.find((p) => p.id === id);
    if (!postulacion) {
      throw new ErrorPostulacionNoEncontrada();
    }
    const estadoAnterior = postulacion.estado as EstadoPostulacion;
    postulacion.estado = nuevoEstado;
    postulacion.updatedAt = new Date();

    if (estadoAnterior !== nuevoEstado) {
      this.actividades.push({
        id: randomUUID(),
        postulacionId: id,
        tipo: "CAMBIO_ESTADO",
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        descripcion: `Estado cambiado de "${ETIQUETA_ESTADO[estadoAnterior]}" a "${ETIQUETA_ESTADO[nuevoEstado]}".`,
        createdAt: new Date(),
        _seq: this.seq++,
      });
      this.notificaciones.push({
        id: randomUUID(),
        usuarioId: postulacion.usuarioId,
        tipo: "ESTADO_POSTULACION",
        titulo: "Actualización de tu postulación",
        mensaje: `Tu postulación a "${postulacion.vacante?.titulo}" ahora está en estado "${ETIQUETA_ESTADO[nuevoEstado]}".`,
        leida: false,
        createdAt: new Date(),
        _seq: this.seq++,
      });
    }
    return postulacion;
  }

  async obtenerActividad(postulacionId: string): Promise<RegistroActividad[]> {
    return this.actividades
      .filter((a) => a.postulacionId === postulacionId)
      .sort((a, b) => b._seq - a._seq) // mas reciente primero (orden de insercion)
      .map(({ _seq, ...resto }) => resto);
  }

  async contarPorEstado(usuarioId: string): Promise<ConteoPorEstado> {
    const conteo = Object.fromEntries(
      ESTADOS_POSTULACION.map((e) => [e, 0])
    ) as ConteoPorEstado;
    for (const p of this.postulaciones.filter((p) => p.usuarioId === usuarioId)) {
      conteo[p.estado as EstadoPostulacion]++;
    }
    return conteo;
  }

  async obtenerNotificaciones(usuarioId: string, soloNoLeidas = false): Promise<Notificacion[]> {
    return this.notificaciones
      .filter((n) => n.usuarioId === usuarioId && (!soloNoLeidas || !n.leida))
      .sort((a, b) => b._seq - a._seq)
      .map(({ _seq, ...resto }) => resto);
  }

  async marcarNotificacionLeida(id: string, usuarioId: string): Promise<boolean> {
    const n = this.notificaciones.find((n) => n.id === id && n.usuarioId === usuarioId);
    if (!n) return false;
    n.leida = true;
    return true;
  }
}
