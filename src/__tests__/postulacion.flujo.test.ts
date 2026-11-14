// Pruebas e2e del flujo principal de la vertical D, a traves del caso de uso
// (PostulacionUseCase) con un repositorio en memoria que implementa el mismo
// puerto que la version con Prisma. Cubre:
//   postularse -> cambiar de estado -> ver la actividad -> recibir la notificacion
// y ademas las reglas de seguridad (dueño) y los casos de error.
//
// Ejecutar con:  npm test   (usa el runner integrado de Node, sin dependencias)

import test from "node:test";
import assert from "node:assert/strict";
import { PostulacionUseCase } from "../application/use-cases/PostulacionUseCase";
import { FakePostulacionRepository } from "./helpers/FakePostulacionRepository";
import { ErrorPostulacionDuplicada } from "../domain/postulaciones/errors/ErrorPostulacionDuplicada";
import { ErrorAccesoDenegado } from "../domain/postulaciones/errors/ErrorAccesoDenegado";
import { ErrorEstadoInvalido } from "../domain/postulaciones/errors/ErrorEstadoInvalido";
import { ErrorPostulacionNoEncontrada } from "../domain/postulaciones/errors/ErrorPostulacionNoEncontrada";

const USUARIO = "user-1";
const OTRO_USUARIO = "user-2";
const VACANTE = "vac-1";

function nuevoCasoDeUso() {
  return new PostulacionUseCase(new FakePostulacionRepository());
}

test("flujo principal: postularse, cambiar estado, ver actividad y recibir notificacion", async () => {
  const useCase = nuevoCasoDeUso();

  // 1. Postularse
  const postulacion = await useCase.postularUsuario(USUARIO, VACANTE);
  assert.equal(postulacion.estado, "POSTULADO");
  assert.equal(postulacion.usuarioId, USUARIO);

  // Aparece en la lista del usuario
  const lista = await useCase.listarPostulaciones(USUARIO);
  assert.equal(lista.length, 1);

  // 2. Cambiar de estado
  const actualizada = await useCase.cambiarEstado(postulacion.id, USUARIO, "ENTREVISTA");
  assert.equal(actualizada.estado, "ENTREVISTA");

  // 3. Ver la actividad (trazabilidad): creacion + cambio de estado
  const actividad = await useCase.obtenerActividad(postulacion.id, USUARIO);
  assert.equal(actividad.length, 2);
  assert.equal(actividad[0].tipo, "CAMBIO_ESTADO"); // mas reciente primero
  assert.equal(actividad[0].estadoAnterior, "POSTULADO");
  assert.equal(actividad[0].estadoNuevo, "ENTREVISTA");
  assert.equal(actividad[1].tipo, "POSTULACION_CREADA");

  // 4. Recibir la notificacion del cambio de estado
  const notificaciones = await useCase.listarNotificaciones(USUARIO);
  assert.equal(notificaciones.length, 1);
  assert.equal(notificaciones[0].tipo, "ESTADO_POSTULACION");
  assert.equal(notificaciones[0].leida, false);
  assert.match(notificaciones[0].mensaje, /Entrevista/);

  // La notificacion se puede marcar como leida
  const marcada = await useCase.marcarNotificacionLeida(notificaciones[0].id, USUARIO);
  assert.equal(marcada, true);
  const noLeidas = await useCase.listarNotificaciones(USUARIO, true);
  assert.equal(noLeidas.length, 0);
});

test("postularse dos veces a la misma vacante lanza ErrorPostulacionDuplicada", async () => {
  const useCase = nuevoCasoDeUso();
  await useCase.postularUsuario(USUARIO, VACANTE);
  await assert.rejects(
    () => useCase.postularUsuario(USUARIO, VACANTE),
    ErrorPostulacionDuplicada
  );
});

test("un usuario no puede cambiar el estado de la postulacion de otro (403)", async () => {
  const useCase = nuevoCasoDeUso();
  const postulacion = await useCase.postularUsuario(USUARIO, VACANTE);
  await assert.rejects(
    () => useCase.cambiarEstado(postulacion.id, OTRO_USUARIO, "ENTREVISTA"),
    ErrorAccesoDenegado
  );
});

test("un usuario no puede ver la actividad de la postulacion de otro (403)", async () => {
  const useCase = nuevoCasoDeUso();
  const postulacion = await useCase.postularUsuario(USUARIO, VACANTE);
  await assert.rejects(
    () => useCase.obtenerActividad(postulacion.id, OTRO_USUARIO),
    ErrorAccesoDenegado
  );
});

test("cambiar a un estado invalido lanza ErrorEstadoInvalido", async () => {
  const useCase = nuevoCasoDeUso();
  const postulacion = await useCase.postularUsuario(USUARIO, VACANTE);
  await assert.rejects(
    () => useCase.cambiarEstado(postulacion.id, USUARIO, "NO_EXISTE"),
    ErrorEstadoInvalido
  );
});

test("cambiar el estado de una postulacion inexistente lanza ErrorPostulacionNoEncontrada", async () => {
  const useCase = nuevoCasoDeUso();
  await assert.rejects(
    () => useCase.cambiarEstado("id-que-no-existe", USUARIO, "ENTREVISTA"),
    ErrorPostulacionNoEncontrada
  );
});

test('"Descartado" puede reabrirse (decision de diseno) y queda en la actividad', async () => {
  const useCase = nuevoCasoDeUso();
  const postulacion = await useCase.postularUsuario(USUARIO, VACANTE);
  await useCase.cambiarEstado(postulacion.id, USUARIO, "DESCARTADO");
  const reabierta = await useCase.cambiarEstado(postulacion.id, USUARIO, "EN_REVISION");
  assert.equal(reabierta.estado, "EN_REVISION");

  const actividad = await useCase.obtenerActividad(postulacion.id, USUARIO);
  // creacion + descartado + reapertura
  assert.equal(actividad.length, 3);
  assert.equal(actividad[0].estadoAnterior, "DESCARTADO");
  assert.equal(actividad[0].estadoNuevo, "EN_REVISION");
});

test("resumen: total, cantidad por estado y tasa de avance", async () => {
  const useCase = nuevoCasoDeUso();
  const p1 = await useCase.postularUsuario(USUARIO, "vac-1");
  await useCase.postularUsuario(USUARIO, "vac-2");
  // Avanzamos solo una de las dos
  await useCase.cambiarEstado(p1.id, USUARIO, "ENTREVISTA");

  const resumen = await useCase.obtenerResumen(USUARIO);
  assert.equal(resumen.total, 2);
  assert.equal(resumen.porEstado.POSTULADO, 1);
  assert.equal(resumen.porEstado.ENTREVISTA, 1);
  assert.equal(resumen.tasaAvance, 0.5); // 1 de 2 avanzo
});
