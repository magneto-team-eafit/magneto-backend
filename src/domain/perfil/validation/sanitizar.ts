// Sanitizacion de los textos que escribe el usuario (OWASP: validar y limpiar
// toda entrada). La validacion revisa que el dato tenga sentido; la
// sanitizacion le quita lo que nunca deberia llevar un nombre, un cargo o un
// resumen: etiquetas HTML, scripts y caracteres de control o invisibles.
// Es una defensa en profundidad: React ya escapa lo que muestra, y Prisma
// usa consultas parametrizadas contra la inyeccion de SQL.

const BLOQUES_PELIGROSOS = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const ETIQUETAS_HTML = /<\/?[a-zA-Z][^>]*>/g;
const APERTURAS_SUELTAS = /<(?=[a-zA-Z/!?])/g;
// Caracteres de control, salvo la tabulacion (09) y el salto de linea (0A).
const CARACTERES_CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
// Espacios de ancho cero y marcas de direccion de texto (se usan para disfrazar contenido).
const CARACTERES_INVISIBLES = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;

export function limpiarTexto(valor: string, opciones: { multilinea?: boolean } = {}): string {
  let texto = valor.normalize("NFC").replace(/\r\n?/g, "\n");

  // Se repite hasta que no cambie: asi no sirven los trucos como
  // "<scr<script>ipt>", que al quitar la etiqueta interna reconstruyen otra.
  let anterior: string;
  do {
    anterior = texto;
    texto = texto.replace(BLOQUES_PELIGROSOS, "").replace(ETIQUETAS_HTML, "");
  } while (texto !== anterior);

  texto = texto
    .replace(APERTURAS_SUELTAS, "")
    .replace(CARACTERES_CONTROL, "")
    .replace(CARACTERES_INVISIBLES, "");

  if (opciones.multilinea) {
    texto = texto
      .replace(/[ \t]+/g, " ")
      .replace(/ ?\n ?/g, "\n")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    texto = texto.replace(/\s+/g, " ");
  }

  return texto.trim();
}