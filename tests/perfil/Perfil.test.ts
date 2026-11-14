import { describe, expect, it } from "vitest";
import { HABILIDADES_PARA_COMPLETAR, PESOS_COMPLETITUD, Perfil, desgloseVacio } from "../../src/domain/perfil/entities/Perfil";

const experiencia = { empresa: "Bancolombia", cargo: "Analista", descripcion: null, fechaInicio: new Date("2024-01-01"), fechaFin: null };
const estudio = { institucion: "EAFIT", titulo: "Ingenieria de Sistemas", nivel: "Pregrado", fechaInicio: null, fechaFin: null };

function perfilNuevo(): Perfil {
  return Perfil.crear({ id: "p1", usuarioId: "u1", nombreCompleto: "Laura Gomez" });
}

function perfilCompleto(): Perfil {
  const p = perfilNuevo();
  p.actualizarDatosPersonales({ nombreCompleto: "Laura Gomez", telefono: "3001234567", ubicacion: "Medellin", resumen: "Ingeniera de sistemas con interes en desarrollo web." });
  p.reemplazarExperiencias([experiencia]);
  p.reemplazarEducaciones([estudio]);
  p.reemplazarHabilidades(["React", "SQL", "Node"]);
  p.actualizarPreferencias({ modalidadPreferida: "Remoto", expectativaSalarial: 4000000, disponibilidad: "Inmediata" });
  return p;
}

describe("Perfil: creacion", () => {
  it("crea un perfil vacio con solo el nombre", () => {
    const p = perfilNuevo();
    expect(p.nombreCompleto).toBe("Laura Gomez");
    expect(p.telefono).toBeNull();
    expect(p.experiencias).toEqual([]);
    expect(p.educaciones).toEqual([]);
    expect(p.habilidades).toEqual([]);
  });

  it("rechaza un nombre vacio o de solo espacios", () => {
    expect(() => Perfil.crear({ id: "p", usuarioId: "u", nombreCompleto: "   " })).toThrow();
  });

  it("reconstruir deja las listas vacias si no se envian", () => {
    const p = Perfil.reconstruir({
      id: "p", usuarioId: "u", nombreCompleto: "Ana", telefono: null, ubicacion: null, resumen: "",
      modalidadPreferida: "", expectativaSalarial: 0, disponibilidad: "",
    });
    expect(p.experiencias).toEqual([]);
    expect(p.habilidades).toEqual([]);
  });
});

describe("Perfil: completitud", () => {
  it("los pesos de las secciones suman 100", () => {
    const suma = Object.values(PESOS_COMPLETITUD).reduce((a, b) => a + b, 0);
    expect(suma).toBe(100);
  });

  it("un perfil recien creado vale 5 % (solo el nombre)", () => {
    expect(perfilNuevo().calcularCompletitud()).toBe(5);
  });

  it("un perfil completo vale 100 %", () => {
    expect(perfilCompleto().calcularCompletitud()).toBe(100);
  });

  it("cada paso suma lo que dice su peso", () => {
    const p = perfilNuevo();
    p.actualizarDatosPersonales({ nombreCompleto: "Laura Gomez", telefono: "3001234567", ubicacion: "Medellin", resumen: "Resumen largo de prueba" });
    expect(p.calcularCompletitud()).toBe(20);
    p.reemplazarExperiencias([experiencia]);
    expect(p.calcularCompletitud()).toBe(45);
    p.reemplazarEducaciones([estudio]);
    expect(p.calcularCompletitud()).toBe(65);
    p.reemplazarHabilidades(["a1", "b2", "c3"]);
    expect(p.calcularCompletitud()).toBe(80);
    p.actualizarPreferencias({ modalidadPreferida: "Remoto", expectativaSalarial: 3000000, disponibilidad: "Inmediata" });
    expect(p.calcularCompletitud()).toBe(100);
  });

  it("las habilidades suman de forma proporcional hasta el minimo", () => {
    const p = perfilNuevo();
    p.reemplazarHabilidades(["a1"]);
    expect(p.calcularDesglose().habilidades.puntos).toBe(5);
    p.reemplazarHabilidades(["a1", "b2"]);
    expect(p.calcularDesglose().habilidades.puntos).toBe(10);
    p.reemplazarHabilidades(["a1", "b2", "c3", "d4", "e5"]);
    expect(p.calcularDesglose().habilidades.puntos).toBe(15); // no pasa del maximo
  });

  it("una seccion de preferencias a medias suma por partes", () => {
    const p = perfilNuevo();
    p.actualizarPreferencias({ modalidadPreferida: "Remoto", expectativaSalarial: 0, disponibilidad: "" });
    expect(p.calcularDesglose().preferencias.puntos).toBeCloseTo(6.67, 2);
  });

  it("un salario de 0 o negativo cuenta como no indicado", () => {
    const p = perfilNuevo();
    p.actualizarPreferencias({ modalidadPreferida: "Remoto", expectativaSalarial: -10, disponibilidad: "Inmediata" });
    expect(p.calcularDesglose().preferencias.puntos).toBeCloseTo(13.33, 2);
  });

  it("el desglose vacio tiene todos los maximos y ningun punto", () => {
    const d = desgloseVacio();
    expect(Object.values(d).every((s) => s.puntos === 0)).toBe(true);
    expect(d.experiencia.maximo).toBe(25);
  });
});

describe("Perfil: sugerencias de mejora", () => {
  it("un perfil completo no tiene sugerencias", () => {
    expect(perfilCompleto().calcularSugerencias()).toEqual([]);
  });

  it("un perfil nuevo sugiere completar las cinco secciones", () => {
    const secciones = perfilNuevo().calcularSugerencias().map((s) => s.seccion);
    expect(secciones.sort()).toEqual(["datosPersonales", "educacion", "experiencia", "habilidades", "preferencias"]);
  });

  it("ordena de la que mas suma a la que menos", () => {
    const puntos = perfilNuevo().calcularSugerencias().map((s) => s.puntos);
    expect(puntos).toEqual([...puntos].sort((a, b) => b - a));
    expect(puntos[0]).toBe(25); // experiencia
  });

  it("lo que suman las sugerencias es exactamente lo que falta para el 100 %", () => {
    const p = perfilNuevo();
    p.reemplazarHabilidades(["a1"]);
    const sumaSugerencias = p.calcularSugerencias().reduce((a, s) => a + s.puntos, 0);
    const puntosActuales = Object.values(p.calcularDesglose()).reduce((a, s) => a + s.puntos, 0);
    expect(sumaSugerencias + puntosActuales).toBeCloseTo(100, 1);
  });

  it("nombra lo que falta en datos personales", () => {
    const p = perfilNuevo();
    p.actualizarDatosPersonales({ nombreCompleto: "Laura Gomez", telefono: "3001234567", ubicacion: "", resumen: "" });
    const s = p.calcularSugerencias().find((x) => x.seccion === "datosPersonales")!;
    expect(s.faltantes).toEqual(["ubicación", "resumen profesional"]);
    expect(s.detalle).toBe("Te falta agregar ubicación y resumen profesional.");
    expect(s.puntos).toBe(10);
  });

  it("para las habilidades dice cuantas faltan", () => {
    const p = perfilNuevo();
    p.reemplazarHabilidades(["React"]);
    const s = p.calcularSugerencias().find((x) => x.seccion === "habilidades")!;
    expect(s.detalle).toBe(`Te faltan 2 habilidades para llegar a ${HABILIDADES_PARA_COMPLETAR}.`);
    p.reemplazarHabilidades(["React", "SQL"]);
    expect(p.calcularSugerencias().find((x) => x.seccion === "habilidades")!.detalle).toBe("Te falta 1 habilidad para llegar a 3.");
  });

  it("la sugerencia desaparece cuando la seccion se completa", () => {
    const p = perfilNuevo();
    p.reemplazarExperiencias([experiencia]);
    expect(p.calcularSugerencias().some((s) => s.seccion === "experiencia")).toBe(false);
  });
});