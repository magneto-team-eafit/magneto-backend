/*
  Warnings:

  - You are about to drop the `Experiencia` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Experiencia" DROP CONSTRAINT "Experiencia_perfilId_fkey";

-- DropTable
DROP TABLE "Experiencia";

-- CreateTable
CREATE TABLE "experiencias" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiencias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "experiencias" ADD CONSTRAINT "experiencias_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
