-- CreateTable
CREATE TABLE "historial_recomendaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "desglose" JSONB NOT NULL,
    "motivos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_recomendaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historial_recomendaciones_usuarioId_createdAt_idx" ON "historial_recomendaciones"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "historial_recomendaciones_vacanteId_idx" ON "historial_recomendaciones"("vacanteId");

-- AddForeignKey
ALTER TABLE "historial_recomendaciones" ADD CONSTRAINT "historial_recomendaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_recomendaciones" ADD CONSTRAINT "historial_recomendaciones_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "vacantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
