import { beforeEach, describe, expect, it } from "vitest";
import { RegistrarUsuario } from "../../src/application/perfil/useCases/RegistrarUsuario";
import { ErrorUsuarioYaExiste } from "../../src/domain/perfil/errors/ErrorUsuarioYaExiste";
import { ErrorValidacion } from "../../src/domain/perfil/errors/ErrorValidacion";
import { HashServiceFalso, UsuarioRepositoryEnMemoria } from "./fakes";

describe("RegistrarUsuario", () => {
  let repositorio: UsuarioRepositoryEnMemoria;
  let hash: HashServiceFalso;
  let registrar: RegistrarUsuario;

  beforeEach(() => {
    repositorio = new UsuarioRepositoryEnMemoria();
    hash = new HashServiceFalso();
    registrar = new RegistrarUsuario(repositorio, hash);
  });

  it("registra un usuario nuevo", async () => {
    const usuario = await registrar.ejecutar({ email: "ana@test.com", password: "Clave12345" });
    expect(usuario.email).toBe("ana@test.com");
    expect(usuario.id).toBeTruthy();
    expect(repositorio.usuarios).toHaveLength(1);
  });

  it("guarda el hash de la contrasena, nunca la contrasena", async () => {
    const usuario = await registrar.ejecutar({ email: "ana@test.com", password: "Clave12345" });
    expect(usuario.passwordHash).toBe("hash(Clave12345)");
    expect(usuario.passwordHash).not.toBe("Clave12345");
  });

  it("normaliza el correo a minusculas", async () => {
    const usuario = await registrar.ejecutar({ email: "  Ana@TEST.com ", password: "Clave12345" });
    expect(usuario.email).toBe("ana@test.com");
  });

  it("rechaza un correo ya registrado", async () => {
    await registrar.ejecutar({ email: "ana@test.com", password: "Clave12345" });
    await expect(registrar.ejecutar({ email: "ana@test.com", password: "OtraClave99" })).rejects.toBeInstanceOf(ErrorUsuarioYaExiste);
    expect(repositorio.usuarios).toHaveLength(1);
  });

  it("detecta el duplicado aunque cambien las mayusculas", async () => {
    await registrar.ejecutar({ email: "ana@test.com", password: "Clave12345" });
    await expect(registrar.ejecutar({ email: "ANA@Test.com", password: "OtraClave99" })).rejects.toBeInstanceOf(ErrorUsuarioYaExiste);
  });

  it("rechaza datos invalidos con el detalle por campo y no guarda nada", async () => {
    const error = await registrar.ejecutar({ email: "no-es-un-correo", password: "corta" }).catch((e) => e);
    expect(error).toBeInstanceOf(ErrorValidacion);
    expect(Object.keys((error as ErrorValidacion).detalles).sort()).toEqual(["email", "password"]);
    expect(repositorio.usuarios).toHaveLength(0);
    expect(hash.comparaciones).toHaveLength(0);
  });

  it("no consulta la base de datos si los datos son invalidos", async () => {
    let consultas = 0;
    repositorio.buscarPorEmail = async () => {
      consultas++;
      return null;
    };
    await registrar.ejecutar({}).catch(() => undefined);
    expect(consultas).toBe(0);
  });
});