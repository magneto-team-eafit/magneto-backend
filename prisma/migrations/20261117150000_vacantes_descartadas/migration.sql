-- CreateTable
CREATE TABLE "vacantes_descartadas" (
    "usuarioId" TEXT NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacantes_descartadas_pkey" PRIMARY KEY ("usuarioId","vacanteId")
);

-- CreateIndex
CREATE INDEX "vacantes_descartadas_vacanteId_idx" ON "vacantes_descartadas"("vacanteId");

-- AddForeignKey
ALTER TABLE "vacantes_descartadas" ADD CONSTRAINT "vacantes_descartadas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacantes_descartadas" ADD CONSTRAINT "vacantes_descartadas_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "vacantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
