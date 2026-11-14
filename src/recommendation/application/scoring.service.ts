import {
  DatosScoringUsuario,
  DatosScoringVacante,
  DesgloseScore,
} from "../domain/recommendation.types";

// Los pesos suman 100. Habilidades pesa mas porque es lo que la persona
// declaro de forma explicita; ubicacion y modalidad son filtros "blandos".
export const PESOS_SCORING = {
  habilidades: 40,
  palabrasClave: 30,
  ubicacion: 15,
  modalidad: 15,
};

// Con cuantas coincidencias consideramos el criterio "completo". Sin esto,
// quien tiene 15 habilidades nunca llegaria a un puntaje alto.
const HABILIDADES_PARA_MAXIMO = 5;
const PALABRAS_PARA_MAXIMO = 6;

// Sin habilidades coincidentes, una vacante solo se recomienda si coincide al
// menos en esta fraccion del puntaje de palabras clave (evita recomendar por
// una palabra suelta).
const MINIMO_PALABRAS_SIN_HABILIDADES = 0.4;

const STOPWORDS = new Set([
  "de", "en", "el", "la", "los", "las", "un", "una", "y", "o", "con", "para",
  "por", "del", "que", "como", "sus", "su", "al", "se", "es", "a", "mi", "me",
  "soy", "mas", "este", "esta", "han", "ser", "sin", "sobre", "entre", "trabajo",
  "experiencia", "area", "anos",
]);

export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

// Dataset: algunas ciudades vienen como "0" o vacias; las tratamos como "sin dato".
function ciudadValida(ciudad?: string | null): string | null {
  const limpia = normalizarTexto(ciudad ?? "");
  return limpia && limpia !== "0" ? limpia : null;
}

function tipoModalidad(modalidad?: string | null): "remoto" | "hibrido" | "presencial" | null {
  const m = normalizarTexto(modalidad ?? "");
  if (m.includes("remoto") || m.includes("remote")) return "remoto";
  if (m.includes("hibrido") || m.includes("hybrid")) return "hibrido";
  if (m.includes("presencial") || m.includes("onsite") || m.includes("on site")) return "presencial";
  return null;
}

// ¿La frase aparece como palabra(s) completa(s) dentro del texto?
// (SQL: como un LIKE '% frase %', para que "sql" no coincida con "mysql").
function contieneFrase(textoNormalizado: string, frase: string): boolean {
  return ` ${textoNormalizado} `.includes(` ${frase} `);
}

function calcularHabilidades(habilidades: string[], textoVacante: string): { puntos: number; coinciden: string[] } {
  const lista = habilidades.map(normalizarTexto).filter((h) => h.length > 0);
  if (lista.length === 0) return { puntos: 0, coinciden: [] };

  const texto = normalizarTexto(textoVacante);
  const coinciden = habilidades.filter((h) => {
    const norm = normalizarTexto(h);
    return norm.length > 0 && contieneFrase(texto, norm);
  });

  const objetivo = Math.min(lista.length, HABILIDADES_PARA_MAXIMO);
  const fraccion = Math.min(1, coinciden.length / objetivo);
  return { puntos: redondear(fraccion * PESOS_SCORING.habilidades), coinciden };
}

// "Sector laboral": palabras del cargo y de los estudios de la persona.
// Una palabra que aparece en el TITULO de la vacante vale el doble que una
// que solo aparece en la descripcion, porque el titulo dice a que se dedica el cargo.
const PUNTOS_TITULO = 2;
const PUNTOS_DESCRIPCION = 1;

function calcularPalabrasClave(textoPerfil: string, titulo: string, descripcion: string): number {
  const palabras = new Set(
    normalizarTexto(textoPerfil)
      .split(" ")
      .filter((p) => p.length > 3 && !STOPWORDS.has(p)),
  );
  if (palabras.size === 0) return 0;

  const textoTitulo = normalizarTexto(titulo);
  const textoDescripcion = normalizarTexto(descripcion);
  let suma = 0;
  for (const p of palabras) {
    if (contieneFrase(textoTitulo, p)) suma += PUNTOS_TITULO;
    else if (contieneFrase(textoDescripcion, p)) suma += PUNTOS_DESCRIPCION;
  }

  const objetivo = Math.min(palabras.size, PALABRAS_PARA_MAXIMO) * 1.5;
  return redondear(Math.min(1, suma / objetivo) * PESOS_SCORING.palabrasClave);
}

function calcularUbicacion(
  ubicacionUsuario?: string | null,
  vacante?: { ubicacion?: string | null; modalidad?: string | null },
): number {
  // Si el trabajo es remoto, la ciudad no importa: puntaje neutro (la mitad),
  // para que "ser remoto" no regale tantos puntos como coincidir en contenido.
  if (tipoModalidad(vacante?.modalidad) === "remoto") return PESOS_SCORING.ubicacion / 2;

  const usuario = ciudadValida(ubicacionUsuario);
  const ciudadVacante = ciudadValida(vacante?.ubicacion);
  if (!usuario || !ciudadVacante) return 0;

  // El perfil puede decir "Medellin, Antioquia": comparamos tambien solo la ciudad.
  const soloCiudadUsuario = usuario.split(" ")[0];
  const coincide =
    usuario === ciudadVacante ||
    ciudadVacante.includes(usuario) ||
    usuario.includes(ciudadVacante) ||
    contieneFrase(ciudadVacante, soloCiudadUsuario);

  return coincide ? PESOS_SCORING.ubicacion : 0;
}

function calcularModalidad(modalidadUsuario?: string | null, modalidadVacante?: string | null): number {
  const u = tipoModalidad(modalidadUsuario);
  const v = tipoModalidad(modalidadVacante);
  if (!u || !v) return 0;
  if (u === v) return PESOS_SCORING.modalidad;
  // Hibrido es un punto medio: acepta algo de remoto o de presencial.
  if (u === "hibrido" || v === "hibrido") return PESOS_SCORING.modalidad / 2;
  return 0;
}

export function calcularScore(
  usuario: DatosScoringUsuario,
  vacante: DatosScoringVacante,
): { score: number; desglose: DesgloseScore; motivos: string[] } {
  const textoVacante = `${vacante.titulo} ${vacante.descripcion}`;
  const hab = calcularHabilidades(usuario.habilidades, textoVacante);

  const desglose: DesgloseScore = {
    habilidades: hab.puntos,
    palabrasClave: calcularPalabrasClave(usuario.textoPerfil, vacante.titulo, vacante.descripcion),
    ubicacion: calcularUbicacion(usuario.ubicacion, vacante),
    modalidad: calcularModalidad(usuario.modalidadPreferida, vacante.modalidad),
    maximos: { ...PESOS_SCORING },
  };

  const score = Math.min(
    100,
    Math.round(desglose.habilidades + desglose.palabrasClave + desglose.ubicacion + desglose.modalidad),
  );

  const motivos: string[] = [];
  if (hab.coinciden.length > 0) {
    const lista = hab.coinciden.slice(0, 4).join(", ");
    motivos.push(`Pide habilidades que tienes: ${lista}.`);
  }
  if (desglose.palabrasClave > 0) motivos.push("Comparte palabras clave con tu experiencia y estudios.");
  if (tipoModalidad(vacante.modalidad) === "remoto") {
    motivos.push("Es remoto: no depende de tu ciudad.");
  } else if (desglose.ubicacion > 0) {
    motivos.push("Está en tu ciudad.");
  }
  if (desglose.modalidad === PESOS_SCORING.modalidad) motivos.push("La modalidad coincide con tu preferencia.");
  else if (desglose.modalidad > 0) motivos.push("La modalidad es compatible con tu preferencia.");
  if (motivos.length === 0) motivos.push("No se encontraron coincidencias claras con tu perfil.");

  return { score, desglose, motivos };
}

// Una vacante es relevante si coincide en contenido: alguna habilidad, o un
// buen nivel de palabras clave del sector. Coincidir solo en ciudad o
// modalidad no basta.
export function esRelevante(desglose: DesgloseScore): boolean {
  return (
    desglose.habilidades > 0 ||
    desglose.palabrasClave >= MINIMO_PALABRAS_SIN_HABILIDADES * desglose.maximos.palabrasClave
  );
}

// Texto para la busqueda full-text de Postgres: habilidades + palabras
// distintivas del perfil, solo letras y numeros (evita caracteres especiales
// del lenguaje de to_tsquery).
export function armarConsultaTexto(habilidades: string[], textoPerfil: string, maxTerminos = 25): string {
  const terminos: string[] = [];
  const vistos = new Set<string>();
  const agregar = (palabra: string) => {
    if (palabra.length > 2 && !STOPWORDS.has(palabra) && !vistos.has(palabra)) {
      vistos.add(palabra);
      terminos.push(palabra);
    }
  };
  for (const h of habilidades) normalizarTexto(h).split(" ").forEach(agregar);
  for (const p of normalizarTexto(textoPerfil).split(" ")) {
    if (p.length > 3) agregar(p);
  }
  return terminos.slice(0, maxTerminos).join(" ");
}
