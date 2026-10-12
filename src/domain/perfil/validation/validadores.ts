// Validadores de cada paso del wizard. Son funciones puras: reciben lo que
// llego del cliente (tipo desconocido), devuelven los datos limpios y un
// mapa de errores por campo. Si "errores" queda vacio, los datos son validos.
// Son el equivalente a las restricciones CHECK de una tabla en SQL, pero
// con un mensaje claro por cada campo que falla.

import { ExperienciaItem, EducacionItem } from "../entities/Perfil";

export type Errores = Record<string, string>;
export const MODALIDADES = ["Remoto", "Presencial", "Hibrido"] as const;
export const DISPONIBILIDADES = ["Inmediata", "1-2 semanas", "1 mes"] as const;
export const NIVELES_EDUCACION = [
    "Bachiller",
    "Tecnico",
    "Tecnologo",
    "Pregrado",
    "Especializacion",
    "Maestria",
    "Doctorado",
    "Otro",
] as const;

// Rango razonable de aspiracion salarial en COP (ajustable).
export const SALARIO_MIN = 500000;
export const SALARIO_MAX = 100000000;

export const MAX_EXPERIENCIAS = 20;
export const MAX_EDUCACIONES = 10;
export const MAX_HABILIDADES = 30;

const REGEX_NOMBRE = /^[\p{L}][\p{L}\s'.-]*$/u;
const REGEX_TELEFONO_CO = /^3\d{9}$/;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

// Valida un texto: lo recorta y revisa largo minimo y maximo.
function validarTexto(
    valor: unknown,
    campo: string,
    errores: Errores,
    opciones: { min: number; max: number; obligatorio: boolean; etiqueta: string }
): string | null {
    if (valor === undefined || valor === null || (typeof valor === "string" && valor.trim() === "")) {
        if (opciones.obligatorio) errores[campo] = `${opciones.etiqueta} es un campo obligatorio.`;
        return null;
    }
    if (typeof valor !== "string") {
        errores[campo] = `${opciones.etiqueta} debe ser texto.`;
        return null;
    }
    const limpio = valor.trim();
    if (limpio.length < opciones.min) {
        errores[campo] = `${opciones.etiqueta} debe tener al menos ${opciones.min} caracteres.`;
        return null;
    }
    if (limpio.length > opciones.max) {
        errores[campo] = `${opciones.etiqueta} no puede superar ${opciones.max} caracteres.`;
        return null;
    }
    return limpio;
}

// Convierte "AAAA-MM-DD" en Date (a medianoche UTC) y valida que sea real.
function validarFecha(
    valor: unknown,
    campo: string,
    errores: Errores,
    opciones: { obligatoria: boolean; etiqueta: string }
): Date | null {
    if (valor === undefined || valor === null || valor === "") {
        if (opciones.obligatoria) errores[campo] = `${opciones.etiqueta} es obligatoria.`;
        return null;
    }
    if (typeof valor !== "string" || !REGEX_FECHA.test(valor)) {
        errores[campo] = `${opciones.etiqueta} debe tener formato AAAA-MM-DD.`;
        return null;
    }
    const fecha = new Date(`${valor}T00:00:00.000Z`);
    if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) {
        errores[campo] = `${opciones.etiqueta} no es una fecha valida.`;
        return null;
    }
    if (fecha.getUTCFullYear() < 1950) {
        errores[campo] = `${opciones.etiqueta} es demasiado antigua.`;
        return null;
    }
    // Se tolera un dia de diferencia por la zona horaria del cliente.
    if (fecha.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
        errores[campo] = `${opciones.etiqueta} no puede estar en el futuro.`;
        return null;
    }
    return fecha;
}

function validarRangoFechas(
    inicio: Date | null,
    fin: Date | null,
    campoFin: string,
    errores: Errores
): void {
    if (inicio && fin && fin.getTime() < inicio.getTime()) {
        errores[campoFin] = "La fecha de fin no puede ser anterior a la de inicio.";
    }
}

// ---------- Paso 1: datos personales ----------

export interface DatosPersonales {
    nombreCompleto: string;
    telefono: string;
    ubicacion: string;
    resumen: string;
}

export function validarDatosPersonales(entrada: unknown): { datos: DatosPersonales; errores: Errores } {
    const errores: Errores = {};
    const e = esObjeto(entrada) ? entrada : {};

    const nombre = validarTexto(e.nombreCompleto, "nombreCompleto", errores, {
        min: 3, max: 100, obligatorio: true, etiqueta: "El nombre completo",
    });
    if (nombre && !REGEX_NOMBRE.test(nombre)) {
        errores.nombreCompleto = "El nombre completo solo puede tener letras, espacios y . ' -";
    }

    // El telefono se normaliza: se quitan espacios, guiones y el prefijo +57.
    let telefono: string | null = null;
    if (e.telefono === undefined || e.telefono === null || e.telefono === "") {
        errores.telefono = "El telefono es obligatorio.";
    } else if (typeof e.telefono !== "string" && typeof e.telefono !== "number") {
        errores.telefono = "El telefono debe ser texto o numero.";
    } else {
        const limpio = String(e.telefono).replace(/[\s-]/g, "").replace(/^\+?57/, "");
        if (REGEX_TELEFONO_CO.test(limpio)) telefono = limpio;
        else errores.telefono = "Ingresa un celular colombiano de 10 digitos que empiece por 3.";
    }

    const ubicacion = validarTexto(e.ubicacion, "ubicacion", errores, {
        min: 2, max: 100, obligatorio: true, etiqueta: "La ubicacion",
    });
    const resumen = validarTexto(e.resumen, "resumen", errores, {
        min: 20, max: 1000, obligatorio: true, etiqueta: "El resumen profesional",
    });

    return {
        datos: {
            nombreCompleto: nombre ?? "",
            telefono: telefono ?? "",
            ubicacion: ubicacion ?? "",
            resumen: resumen ?? "",
        },
        errores,
    };
}

// ---------- Paso 2: experiencia ----------

export function validarExperiencias(entrada: unknown): { datos: ExperienciaItem[]; errores: Errores } {
    const errores: Errores = {};
    const lista = esObjeto(entrada) ? entrada.experiencias : undefined;

    if (!Array.isArray(lista)) {
        errores.experiencias = "Envia la lista de experiencias (puede estar vacia).";
        return { datos: [], errores };
    }
    if (lista.length > MAX_EXPERIENCIAS) {
        errores.experiencias = `Maximo ${MAX_EXPERIENCIAS} experiencias.`;
        return { datos: [], errores };
    }

    const datos: ExperienciaItem[] = [];
    lista.forEach((item, i) => {
        const p = `experiencias[${i}]`;
        if (!esObjeto(item)) {
            errores[p] = "Cada experiencia debe ser un objeto.";
            return;
        }
        const empresa = validarTexto(item.empresa, `${p}.empresa`, errores, {
            min: 2, max: 100, obligatorio: true, etiqueta: "La empresa",
        });
        const cargo = validarTexto(item.cargo, `${p}.cargo`, errores, {
            min: 2, max: 100, obligatorio: true, etiqueta: "El cargo",
        });
        const descripcion = validarTexto(item.descripcion, `${p}.descripcion`, errores, {
            min: 0, max: 1000, obligatorio: false, etiqueta: "La descripcion",
        });
        const fechaInicio = validarFecha(item.fechaInicio, `${p}.fechaInicio`, errores, {
            obligatoria: true, etiqueta: "La fecha de inicio",
        });
        const fechaFin = validarFecha(item.fechaFin, `${p}.fechaFin`, errores, {
            obligatoria: false, etiqueta: "La fecha de fin",
        });
        validarRangoFechas(fechaInicio, fechaFin, `${p}.fechaFin`, errores);

        datos.push({
            empresa: empresa ?? "",
            cargo: cargo ?? "",
            descripcion,
            fechaInicio,
            fechaFin,
        });
    });

    return { datos, errores };
}

// ---------- Paso 3: educacion ----------

export function validarEducaciones(entrada: unknown): { datos: EducacionItem[]; errores: Errores } {
    const errores: Errores = {};
    const lista = esObjeto(entrada) ? entrada.educaciones : undefined;

    if (!Array.isArray(lista)) {
        errores.educaciones = "Envia la lista de estudios (puede estar vacia).";
        return { datos: [], errores };
    }
    if (lista.length > MAX_EDUCACIONES) {
        errores.educaciones = `Maximo ${MAX_EDUCACIONES} estudios.`;
        return { datos: [], errores };
    }

    const datos: EducacionItem[] = [];
    lista.forEach((item, i) => {
        const p = `educaciones[${i}]`;
        if (!esObjeto(item)) {
            errores[p] = "Cada estudio debe ser un objeto.";
            return;
        }
        const institucion = validarTexto(item.institucion, `${p}.institucion`, errores, {
            min: 2, max: 150, obligatorio: true, etiqueta: "La institucion",
        });
        const titulo = validarTexto(item.titulo, `${p}.titulo`, errores, {
            min: 2, max: 150, obligatorio: true, etiqueta: "El titulo",
        });

        let nivel: string | null = null;
        if (typeof item.nivel !== "string" || !(NIVELES_EDUCACION as readonly string[]).includes(item.nivel)) {
            errores[`${p}.nivel`] = `El nivel debe ser uno de: ${NIVELES_EDUCACION.join(", ")}.`;
        } else {
            nivel = item.nivel;
        }

        const fechaInicio = validarFecha(item.fechaInicio, `${p}.fechaInicio`, errores, {
            obligatoria: false, etiqueta: "La fecha de inicio",
        });
        const fechaFin = validarFecha(item.fechaFin, `${p}.fechaFin`, errores, {
            obligatoria: false, etiqueta: "La fecha de fin",
        });
        validarRangoFechas(fechaInicio, fechaFin, `${p}.fechaFin`, errores);

        datos.push({ institucion: institucion ?? "", titulo: titulo ?? "", nivel, fechaInicio, fechaFin });
    });

    return { datos, errores };
}

// ---------- Paso 4: habilidades ----------

export function validarHabilidades(entrada: unknown): { datos: string[]; errores: Errores } {
    const errores: Errores = {};
    const lista = esObjeto(entrada) ? entrada.habilidades : undefined;

    if (!Array.isArray(lista)) {
        errores.habilidades = "Envia la lista de habilidades (puede estar vacia).";
        return { datos: [], errores };
    }

    const vistas = new Set<string>();
    const datos: string[] = [];
    lista.forEach((item, i) => {
        const campo = `habilidades[${i}]`;
        const nombre = validarTexto(item, campo, errores, {
            min: 2, max: 40, obligatorio: true, etiqueta: "La habilidad",
        });
        if (!nombre) return;
        // Se evitan repetidas sin importar mayusculas ni minusculas.
        const clave = nombre.toLowerCase();
        if (vistas.has(clave)) return;
        vistas.add(clave);
        datos.push(nombre);
    });

    if (datos.length > MAX_HABILIDADES) {
        errores.habilidades = `Maximo ${MAX_HABILIDADES} habilidades.`;
    }

    return { datos, errores };
}

// ---------- Paso 5: preferencias ----------

export interface Preferencias {
    modalidadPreferida: string;
    expectativaSalarial: number;
    disponibilidad: string;
}

export function validarPreferencias(entrada: unknown): { datos: Preferencias; errores: Errores } {
    const errores: Errores = {};
    const e = esObjeto(entrada) ? entrada : {};

    let modalidad = "";
    if (typeof e.modalidadPreferida !== "string" || !(MODALIDADES as readonly string[]).includes(e.modalidadPreferida)) {
        errores.modalidadPreferida = `La modalidad debe ser una de: ${MODALIDADES.join(", ")}.`;
    } else {
        modalidad = e.modalidadPreferida;
    }

    let salario = 0;
    const crudo = typeof e.expectativaSalarial === "string" && e.expectativaSalarial.trim() !== ""
        ? Number(e.expectativaSalarial)
        : e.expectativaSalarial;
    if (typeof crudo !== "number" || !Number.isInteger(crudo)) {
        errores.expectativaSalarial = "La aspiracion salarial debe ser un numero entero en COP.";
    } else if (crudo < SALARIO_MIN || crudo > SALARIO_MAX) {
        errores.expectativaSalarial =
            `La aspiracion salarial debe estar entre ${SALARIO_MIN.toLocaleString("es-CO")} y ${SALARIO_MAX.toLocaleString("es-CO")} COP.`;
    } else {
        salario = crudo;
    }

    let disponibilidad = "";
    if (typeof e.disponibilidad !== "string" || !(DISPONIBILIDADES as readonly string[]).includes(e.disponibilidad)) {
        errores.disponibilidad = `La disponibilidad debe ser una de: ${DISPONIBILIDADES.join(", ")}.`;
    } else {
        disponibilidad = e.disponibilidad;
    }

    return {
        datos: { modalidadPreferida: modalidad, expectativaSalarial: salario, disponibilidad },
        errores,
    };
}