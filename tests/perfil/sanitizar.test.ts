import { describe, expect, it } from "vitest";
import { limpiarTexto } from "../../src/domain/perfil/validation/sanitizar";

describe("limpiarTexto", () => {
  it("quita un script junto con su contenido", () => {
    expect(limpiarTexto("<script>alert(1)</script>Hola")).toBe("Hola");
  });

  it("quita etiquetas HTML y deja el texto", () => {
    expect(limpiarTexto("Ingeniero <b>civil</b> con <i>experiencia</i>")).toBe("Ingeniero civil con experiencia");
  });

  it("no se deja enganar por etiquetas que se reconstruyen al limpiar", () => {
    const resultado = limpiarTexto("<scr<script>ipt>alert(1)</scr</script>ipt>Ok");
    expect(resultado).not.toMatch(/<\s*\/?\s*script/i);
    expect(resultado).toContain("Ok");
  });

  it("quita etiquetas con atributos peligrosos", () => {
    const resultado = limpiarTexto('Hola <img src=x onerror="alert(1)"> mundo');
    expect(resultado).toBe("Hola mundo");
  });

  it("quita etiquetas que quedaron sin cerrar", () => {
    expect(limpiarTexto("Texto <img src=x onerror=alert(1)")).not.toContain("<");
  });

  it("no toca los simbolos de comparacion legitimos", () => {
    expect(limpiarTexto("5 < 7 y 9 > 3 (C++ y Java)")).toBe("5 < 7 y 9 > 3 (C++ y Java)");
  });

  it("quita caracteres de control", () => {
    expect(limpiarTexto("Ana\u0000 Gomez\u0007")).toBe("Ana Gomez");
  });

  it("quita caracteres invisibles y marcas de direccion de texto", () => {
    expect(limpiarTexto("Ana\u200B Gomez\u202Egnirts")).toBe("Ana Gomezgnirts");
  });

  it("colapsa los espacios repetidos y recorta los extremos", () => {
    expect(limpiarTexto("  Laura    Gomez   ")).toBe("Laura Gomez");
  });

  it("normaliza las tildes combinadas (NFC)", () => {
    expect(limpiarTexto("Medelli\u0301n")).toBe("Medellín");
  });

  it("en modo multilinea conserva los parrafos pero limita los saltos", () => {
    expect(limpiarTexto("Linea 1\r\n\r\n\r\n\r\nLinea 2   con   espacios", { multilinea: true })).toBe("Linea 1\n\nLinea 2 con espacios");
  });

  it("en modo normal convierte los saltos de linea en espacios", () => {
    expect(limpiarTexto("Linea 1\nLinea 2")).toBe("Linea 1 Linea 2");
  });

  it("un texto de solo etiquetas queda vacio", () => {
    expect(limpiarTexto("<b></b><i> </i>")).toBe("");
  });
});