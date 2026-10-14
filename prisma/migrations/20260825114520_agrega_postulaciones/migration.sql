-- CreateTable
CREATE TABLE "postulaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'POSTULADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postulaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "postulaciones_usuarioId_vacanteId_key" ON "postulaciones"("usuarioId", "vacanteId");

-- AddForeignKey
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "vacantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
