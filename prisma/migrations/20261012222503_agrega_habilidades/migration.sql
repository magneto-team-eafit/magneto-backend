-- CreateTable
CREATE TABLE "habilidades" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habilidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "habilidades_perfilId_nombre_key" ON "habilidades"("perfilId", "nombre");

-- AddForeignKey
ALTER TABLE "habilidades" ADD CONSTRAINT "habilidades_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
