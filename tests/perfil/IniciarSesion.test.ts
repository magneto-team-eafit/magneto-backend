import { beforeEach, describe, expect, it } from "vitest";
import { IniciarSesion } from "../../src/application/perfil/useCases/IniciarSesion";
import { RegistrarUsuario } from "../../src/application/perfil/useCases/RegistrarUsuario";
import { ErrorCredencialesInvalidas } from "../../src/domain/perfil/errors/ErrorCredencialesInvalidas";
import { ErrorValidacion } from "../../src/domain/perfil/errors/ErrorValidacion";
import { HashServiceFalso, JwtServiceFalso, UsuarioRepositoryEnMemoria } from "./fakes";

describe("IniciarSesion", () => {
  let hash: HashServiceFalso;
  let iniciarSesion: IniciarSesion;
  let usuarioId: string;

  beforeEach(async () => {
    const repositorio = new UsuarioRepositoryEnMemoria();
    hash = new HashServiceFalso();
    iniciarSesion = new IniciarSesion(repositorio, hash, new JwtServiceFalso());
    usuarioId = (await new RegistrarUsuario(repositorio, hash).ejecutar({ email: "ana@test.com", password: "Clave12345" })).id;
    hash.comparaciones.length = 0; // se descartan las comparaciones del registro
  });

  it("devuelve el token, el id y el correo con credenciales correctas", async () => {
    const r = await iniciarSesion.ejecutar({ email: "ana@test.com", password: "Clave12345" });
    expect(r).toEqual({ token: `token-de-${usuarioId}`, usuarioId, email: "ana@test.com" });
  });

  it("acepta el correo escrito con otras mayusculas", async () => {
    const r = await iniciarSesion.ejecutar({ email: " ANA@Test.com ", password: "Clave12345" });
    expect(r.usuarioId).toBe(usuarioId);
  });

  it("rechaza una contrasena incorrecta", async () => {
    await expect(iniciarSesion.ejecutar({ email: "ana@test.com", password: "Equivocada1" })).rejects.toBeInstanceOf(ErrorCredencialesInvalidas);
  });

  it("rechaza un correo que no existe con el mismo error que una contrasena mala", async () => {
    const malaClave = await iniciarSesion.ejecutar({ email: "ana@test.com", password: "Equivocada1" }).catch((e) => e);
    const sinCuenta = await iniciarSesion.ejecutar({ email: "nadie@test.com", password: "Clave12345" }).catch((e) => e);
    expect(sinCuenta).toBeInstanceOf(ErrorCredencialesInvalidas);
    expect(sinCuenta.message).toBe(malaClave.message); // no revela que cuentas existen
  });

  it("con un correo inexistente igual hace una comparacion de hash (mismo tiempo de respuesta)", async () => {
    await iniciarSesion.ejecutar({ email: "nadie@test.com", password: "Clave12345" }).catch(() => undefined);
    expect(hash.comparaciones).toHaveLength(1);
  });

  it("exige correo y contrasena", async () => {
    await expect(iniciarSesion.ejecutar({ email: "ana@test.com" })).rejects.toBeInstanceOf(ErrorValidacion);
    await expect(iniciarSesion.ejecutar({})).rejects.toBeInstanceOf(ErrorValidacion);
  });

  it("no genera token si las credenciales fallan", async () => {
    const r = await iniciarSesion.ejecutar({ email: "ana@test.com", password: "Equivocada1" }).catch((e) => e);
    expect(r).not.toHaveProperty("token");
  });
});