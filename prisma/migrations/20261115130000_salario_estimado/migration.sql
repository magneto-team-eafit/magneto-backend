-- Marca si el salario de la vacante es un rango de referencia estimado
-- (true) o el que decia la oferta (false). Las vacantes existentes quedan en false.
ALTER TABLE "vacantes" ADD COLUMN "salarioEstimado" BOOLEAN NOT NULL DEFAULT false;
