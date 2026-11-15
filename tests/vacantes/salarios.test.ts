import { describe, it, expect } from "vitest";
import { extraerSalarioReal, estimarSalario } from "../../src/domain/vacantes/salarios";
import { inferirNivel, esTecnico } from "../../src/domain/vacantes/clasificacion";

describe("extraerSalarioReal", () => {
  it("lee un salario simple con signo pesos", () => {
    expect(extraerSalarioReal("Contrato a termino fijo. Salario: $1.000.000 mas auxilio")).toEqual({ min: 1_000_000, max: 1_000_000 });
  });

  it("lee un salario sin signo pesos y con espacios", () => {
    expect(extraerSalarioReal("SALARIO BÁSICO: $ 1.447.000")).toEqual({ min: 1_447_000, max: 1_447_000 });
    expect(extraerSalarioReal("Salario basico de 1.042.000 + Auxilio de transporte")).toEqual({ min: 1_042_000, max: 1_042_000 });
  });

  it("lee un rango 'de X a Y'", () => {
    expect(extraerSalarioReal("Salario de $1.000.000 a $1.200.000. Lugar de trabajo")).toEqual({ min: 1_000_000, max: 1_200_000 });
  });

  it("lee montos en millones", () => {
    expect(extraerSalarioReal("Sueldo de 4,5 millones mensuales")).toEqual({ min: 4_500_000, max: 4_500_000 });
  });

  it("ignora bonos y auxilios que no son salario", () => {
    expect(extraerSalarioReal("Bono $350.000 + auxilio de transporte $250.000")).toBeNull();
  });

  it("no inventa nada si no hay monto o el monto es raro", () => {
    expect(extraerSalarioReal("Ofrecemos buen salario y excelente ambiente")).toBeNull();
    expect(extraerSalarioReal("Salario 2026")).toBeNull();
    expect(extraerSalarioReal("Salario de 2.100.00 a 2.500.000")).toBeNull(); // mal escrito en la oferta
  });
});

describe("clasificacion", () => {
  it("infiere el nivel por palabras completas del titulo", () => {
    expect(inferirNivel("Auxiliar de Crédito")).toBe("Entry level");
    expect(inferirNivel("Practicante de Ingeniería")).toBe("Entry level");
    expect(inferirNivel("Analista de Datos")).toBe("Associate");
    expect(inferirNivel("Coordinador de Operaciones")).toBe("Mid-Senior level");
    expect(inferirNivel("Gerente comercial de hardlines")).toBe("Director");
    expect(inferirNivel("Feria Empleo")).toBeNull();
  });

  it("no confunde 'sr' con 'asesor'", () => {
    expect(inferirNivel("Asesor comercial")).toBe("Associate");
  });

  it("detecta cargos tecnicos", () => {
    expect(esTecnico("Analista BI – Power BI")).toBe(true);
    expect(esTecnico("Auxiliar contable")).toBe(false);
  });
});

describe("estimarSalario", () => {
  it("siempre da el mismo rango para la misma vacante", () => {
    expect(estimarSalario("Analista de Datos", "url-1")).toEqual(estimarSalario("Analista de Datos", "url-1"));
  });

  it("da un rango valido: min <= max, redondeado a 100 mil", () => {
    for (const t of ["Gerente comercial", "Auxiliar de bodega", "Practicante", "Desarrollador Java Senior", "Feria Empleo"]) {
      const r = estimarSalario(t, "semilla-" + t);
      expect(r.min).toBeLessThanOrEqual(r.max);
      expect(r.min % 100_000).toBe(0);
      expect(r.max % 100_000).toBe(0);
    }
  });

  it("los cargos mas altos pagan mas que los iniciales", () => {
    const director = estimarSalario("Gerente comercial", "a");
    const auxiliar = estimarSalario("Auxiliar administrativo", "a");
    expect(director.min).toBeGreaterThan(auxiliar.max);
  });
});
