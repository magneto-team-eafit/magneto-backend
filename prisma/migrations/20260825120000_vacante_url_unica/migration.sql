-- AlterTable: urlOriginal unico para que el seed sea reejecutable
-- (createMany + skipDuplicates necesita una restriccion unica real
-- contra la cual comparar; sin esto, cada corrida duplicaba las
-- ~122.000 filas).
CREATE UNIQUE INDEX "vacantes_urlOriginal_key" ON "vacantes"("urlOriginal");
