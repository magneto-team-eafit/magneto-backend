-- Creamos el indice GIN usando exactamente la misma expresion to_tsvector del repositorio
CREATE INDEX IF NOT EXISTS vacantes_busqueda_fulltext_idx
    ON vacantes USING GIN (to_tsvector('spanish', titulo || ' ' || empresa || ' ' || descripcion));