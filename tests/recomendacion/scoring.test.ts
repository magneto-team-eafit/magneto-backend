import { describe, expect, it } from "vitest";
import {
  PESOS_SCORING,
  armarConsultaTexto,
  calcularScore,
  esRelevante,
} from "../../src/recommendation/application/scoring.service";

const usuario = {
  ubicacion: "Medellín, Antioquia",
  modalidadPreferida: "Remoto",
  habilidades: ["SQL", "Python", "Power BI"],
  textoPerfil: "Analista de datos con estudios en ingeniería de sistemas",
};

const vacante = (o: Partial<{ titulo: string; descripcion: string; ubicacion: string | null; modalidad: string | null }> = {}) => ({
  id: "v1",
  titulo: "Analista de datos",
  empresa: "Acme",
  descripcion: "Buscamos alguien con SQL y Python para reportes en Power BI",
  ubicacion: "Medellín",
  modalidad: "remoto",
  ...o,
});

describe("calcularScore", () => {
  it("los pesos suman 100", () => {
    const { habilidades, palabrasClave, ubicacion, modalidad } = PESOS_SCORING;
    expect(habilidades + palabrasClave + ubicacion + modalidad).toBe(100);
  });

  it("una vacante muy afin llega a un puntaje alto y trae los maximos", () => {
    const r = calcularScore(usuario, vacante());
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.desglose.maximos.habilidades).toBe(40);
    expect(r.desglose.maximos.palabrasClave).toBe(30);
    expect(r.motivos[0]).toContain("SQL");
  });

  it("no confunde sql con mysql (palabra completa)", () => {
    const r = calcularScore(
      { ...usuario, habilidades: ["SQL"] },
      vacante({ descripcion: "Experiencia en MySQL", titulo: "Desarrollador" }),
    );
    expect(r.desglose.habilidades).toBe(0);
  });

  it("una vacante remota da puntaje neutro de ubicacion (la mitad) aunque sea de otra ciudad", () => {
    const r = calcularScore(usuario, vacante({ ubicacion: "Cali", modalidad: "remoto" }));
    expect(r.desglose.ubicacion).toBe(PESOS_SCORING.ubicacion / 2);
  });

  it("una vacante presencial de otra ciudad no suma ubicacion", () => {
    const r = calcularScore(usuario, vacante({ ubicacion: "Cali", modalidad: "presencial" }));
    expect(r.desglose.ubicacion).toBe(0);
    expect(r.desglose.modalidad).toBe(0);
  });

  it("ignora ciudades '0' del dataset", () => {
    const r = calcularScore(usuario, vacante({ ubicacion: "0", modalidad: "presencial" }));
    expect(r.desglose.ubicacion).toBe(0);
  });

  it("hibrido da la mitad de modalidad con remoto", () => {
    const r = calcularScore({ ...usuario, modalidadPreferida: "Híbrido" }, vacante());
    expect(r.desglose.modalidad).toBe(PESOS_SCORING.modalidad / 2);
  });
});

describe("esRelevante", () => {
  it("coincidir solo en ciudad o modalidad no basta", () => {
    const r = calcularScore(
      { ...usuario, habilidades: ["Soldadura"], textoPerfil: "Soldador industrial" },
      vacante({ titulo: "Vendedor", descripcion: "Atencion a clientes en tienda" }),
    );
    expect(r.desglose.ubicacion + r.desglose.modalidad).toBeGreaterThan(0);
    expect(esRelevante(r.desglose)).toBe(false);
  });
});

describe("armarConsultaTexto", () => {
  it("devuelve solo palabras limpias, sin repetidas ni stopwords", () => {
    const q = armarConsultaTexto(["SQL", "Power BI", "sql"], "Analista de datos & (reportes)");
    expect(q.split(" ")).toEqual(["sql", "power", "analista", "datos", "reportes"]);
  });
});
