// Piezas de SQL compartidas por el listado de vacantes y el recomendador.
// La funcion sin_tildes() la crea la migracion 20261115120000_busqueda_sin_tildes
// (quita tildes y mayusculas). La expresion de TEXTO_VACANTE_SQL tiene que ser
// IDENTICA a la del indice GIN para que Postgres lo use.

export const TEXTO_VACANTE_SQL = `to_tsvector('spanish', sin_tildes(titulo || ' ' || empresa || ' ' || descripcion))`;

// Igual que la anterior pero con el alias "v" (para consultas con JOIN o subconsultas).
export const TEXTO_VACANTE_V_SQL = `to_tsvector('spanish', sin_tildes(v.titulo || ' ' || v.empresa || ' ' || v.descripcion))`;

// Escapa los comodines de LIKE (% _ \) para que lo que escribe la persona se
// busque tal cual y no como patron.
export function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => "\\" + c);
}

// Patron para "contiene": %texto%. La comparacion en SQL se hace con
// sin_tildes() de los dos lados, asi que aqui no hace falta quitar tildes.
export function patronContiene(texto: string): string {
  return `%${escaparLike(texto.trim())}%`;
}
