-- Busqueda que ignora tildes y mayusculas ("Bogota" encuentra "Bogotá").
-- Es una funcion IMMUTABLE (solo usa lower y translate), por eso se puede
-- usar dentro de un indice. No necesita la extension unaccent, asi que
-- funciona igual en cualquier Postgres (local o de hosting).
CREATE OR REPLACE FUNCTION sin_tildes(texto text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT translate(lower(texto), 'áéíóúüñàèìòù', 'aeiouunaeiou') $$;

-- Reemplazamos el indice GIN: ahora indexa el texto ya sin tildes.
-- La expresion debe ser identica a la que usan las consultas.
DROP INDEX IF EXISTS vacantes_busqueda_fulltext_idx;
CREATE INDEX vacantes_busqueda_fulltext_idx
    ON vacantes USING GIN (to_tsvector('spanish', sin_tildes(titulo || ' ' || empresa || ' ' || descripcion)));

-- Para filtrar por ubicacion sin tildes con LIKE.
CREATE INDEX IF NOT EXISTS vacantes_ubicacion_sin_tildes_idx
    ON vacantes (sin_tildes(ubicacion) text_pattern_ops);
