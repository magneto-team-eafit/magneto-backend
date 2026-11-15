import { describe, it, expect } from "vitest";
import { escaparLike, patronContiene, TEXTO_VACANTE_SQL, TEXTO_VACANTE_V_SQL } from "../../src/infrastructure/vacantes/busquedaSql";

describe("busquedaSql", () => {
  it("escapa los comodines de LIKE para buscarlos tal cual", () => {
    expect(escaparLike("100%")).toBe("100\\%");
    expect(escaparLike("a_b")).toBe("a\\_b");
    expect(escaparLike("c:\\x")).toBe("c:\\\\x");
  });

  it("arma el patron 'contiene' recortando espacios", () => {
    expect(patronContiene("  Bogotá ")).toBe("%Bogotá%");
  });

  it("el texto de busqueda usa sin_tildes igual que el indice", () => {
    expect(TEXTO_VACANTE_SQL).toContain("sin_tildes(");
    // la version con alias v es la misma expresion, solo con v. delante de cada columna
    expect(TEXTO_VACANTE_V_SQL.replace(/v\./g, "")).toBe(TEXTO_VACANTE_SQL);
  });
});
