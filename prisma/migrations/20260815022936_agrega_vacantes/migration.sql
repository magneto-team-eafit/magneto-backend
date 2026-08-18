-- CreateTable
CREATE TABLE "vacantes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "ubicacion" TEXT,
    "modalidad" TEXT,
    "nivelExperiencia" TEXT,
    "salarioMin" INTEGER,
    "salarioMax" INTEGER,
    "moneda" TEXT,
    "descripcion" TEXT NOT NULL,
    "urlOriginal" TEXT,
    "fuente" TEXT NOT NULL DEFAULT 'kaggle-linkedin',
    "fechaPublicacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacantes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vacantes_ubicacion_idx" ON "vacantes"("ubicacion");

-- CreateIndex
CREATE INDEX "vacantes_modalidad_idx" ON "vacantes"("modalidad");
