-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "telefono" TEXT,
    "ubicacion" TEXT,
    "resumen" TEXT NOT NULL,
    "modalidadPreferida" TEXT NOT NULL,
    "expectativaSalarial" INTEGER NOT NULL,
    "disponibilidad" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educaciones" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "institucion" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "nivel" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "educaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiencia" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Experiencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_usuarioId_key" ON "perfiles"("usuarioId");

-- AddForeignKey
ALTER TABLE "perfiles" ADD CONSTRAINT "perfiles_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educaciones" ADD CONSTRAINT "educaciones_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiencia" ADD CONSTRAINT "Experiencia_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
