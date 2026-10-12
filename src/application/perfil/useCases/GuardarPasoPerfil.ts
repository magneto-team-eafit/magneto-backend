import { randomUUID } from "crypto";
import { Perfil } from "../../../domain/perfil/entities/Perfil";
import { IPerfilRepository } from "../../../domain/perfil/repositories/IPerfilRepository";
import { ErrorValidacion } from "../../../domain/perfil/errors/ErrorValidacion";
import {
  Errores,
  validarDatosPersonales,
  validarExperiencias,
  validarEducaciones,
  validarHabilidades,
  validarPreferencias,
} from "../../../domain/perfil/validation/validadores";

export const PASOS_PERFIL = [
  "datos-personales",
  "experiencia",
  "educacion",
  "habilidades",
  "preferencias",
] as const;

export type PasoPerfil = (typeof PASOS_PERFIL)[number];

function lanzarSiHayErrores(errores: Errores): void {
  if (Object.keys(errores).length > 0) throw new ErrorValidacion(errores);
}

// Guarda un paso del wizard. Sirve tanto para el onboarding inicial como
// para editar el perfil despues: se vuelve a enviar el mismo paso.
export class GuardarPasoPerfil {
  constructor(private readonly perfilRepository: IPerfilRepository) {}

  async ejecutar(usuarioId: string, paso: PasoPerfil, datos: unknown): Promise<Perfil> {
    const existente = await this.perfilRepository.buscarPorUsuarioId(usuarioId);

    if (paso === "datos-personales") {
      const { datos: d, errores } = validarDatosPersonales(datos);
      lanzarSiHayErrores(errores);

      // Primera vez: se crea el perfil con el nombre. Despues: se edita.
      const perfil =
        existente ?? Perfil.crear({ id: randomUUID(), usuarioId, nombreCompleto: d.nombreCompleto });
      perfil.actualizarDatosPersonales(d);
      await this.perfilRepository.guardar(perfil);
      return perfil;
    }

    // Los demas pasos cuelgan del perfil: se valida primero la entrada y
    // despues que el perfil exista (como una llave foranea en SQL: no se
    // puede insertar una fila hija si el padre no existe).
    switch (paso) {
      case "experiencia": {
        const { datos: items, errores } = validarExperiencias(datos);
        lanzarSiHayErrores(errores);
        const perfil = this.exigirPerfil(existente);
        perfil.reemplazarExperiencias(items);
        await this.perfilRepository.reemplazarExperiencias(perfil.id, items);
        return perfil;
      }
      case "educacion": {
        const { datos: items, errores } = validarEducaciones(datos);
        lanzarSiHayErrores(errores);
        const perfil = this.exigirPerfil(existente);
        perfil.reemplazarEducaciones(items);
        await this.perfilRepository.reemplazarEducaciones(perfil.id, items);
        return perfil;
      }
      case "habilidades": {
        const { datos: nombres, errores } = validarHabilidades(datos);
        lanzarSiHayErrores(errores);
        const perfil = this.exigirPerfil(existente);
        perfil.reemplazarHabilidades(nombres);
        await this.perfilRepository.reemplazarHabilidades(perfil.id, nombres);
        return perfil;
      }
      case "preferencias": {
        const { datos: d, errores } = validarPreferencias(datos);
        lanzarSiHayErrores(errores);
        const perfil = this.exigirPerfil(existente);
        perfil.actualizarPreferencias(d);
        await this.perfilRepository.guardar(perfil);
        return perfil;
      }
    }
  }

  private exigirPerfil(perfil: Perfil | null): Perfil {
    if (!perfil) {
      throw new ErrorValidacion({ perfil: "Primero completa tus datos personales." });
    }
    return perfil;
  }
}