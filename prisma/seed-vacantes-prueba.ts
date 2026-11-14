// Seed de vacantes de PRUEBA (no usa el CSV de Kaggle).
// Sirve para probar el flujo de postulaciones/tablero en local sin el dataset.
//
// Ejecutar con:  npx tsx prisma/seed-vacantes-prueba.ts
//
// Es idempotente: cada vacante tiene una urlOriginal unica, asi que correrlo
// varias veces no crea duplicados (skipDuplicates).

import "dotenv/config";
import { prisma } from "../src/infrastructure/database/PrismaClient";

const vacantes = [
  {
    titulo: "Desarrollador Backend Node.js",
    empresa: "Bancolombia",
    ubicacion: "Medellín, Colombia",
    modalidad: "remoto",
    nivelExperiencia: "Semi Senior",
    salarioMin: 6000000,
    salarioMax: 9000000,
    moneda: "COP",
    descripcion:
      "Buscamos un desarrollador backend con experiencia en Node.js, TypeScript y PostgreSQL para unirse al equipo de plataformas digitales. Trabajarás en APIs REST, microservicios y buenas prácticas de arquitectura limpia.",
    urlOriginal: "https://ejemplo.test/vacantes/backend-node-bancolombia",
    fuente: "prueba",
    fechaPublicacion: new Date("2026-11-01"),
  },
  {
    titulo: "Ingeniero Frontend React",
    empresa: "Rappi",
    ubicacion: "Bogotá, Colombia",
    modalidad: "híbrido",
    nivelExperiencia: "Senior",
    salarioMin: 8000000,
    salarioMax: 12000000,
    moneda: "COP",
    descripcion:
      "Únete al equipo de experiencia de usuario. Desarrollarás interfaces con React 19, TypeScript y Tailwind. Valoramos atención al detalle, accesibilidad y rendimiento.",
    urlOriginal: "https://ejemplo.test/vacantes/frontend-react-rappi",
    fuente: "prueba",
    fechaPublicacion: new Date("2026-11-03"),
  },
  {
    titulo: "Desarrollador Full Stack",
    empresa: "Mercado Libre",
    ubicacion: "Remoto - Colombia",
    modalidad: "remoto",
    nivelExperiencia: "Semi Senior",
    salarioMin: 7000000,
    salarioMax: 10500000,
    moneda: "COP",
    descripcion:
      "Posición full stack para construir funcionalidades de punta a punta: frontend en React, backend en Node.js/Express y base de datos relacional. Ambiente ágil y colaborativo.",
    urlOriginal: "https://ejemplo.test/vacantes/fullstack-mercadolibre",
    fuente: "prueba",
    fechaPublicacion: new Date("2026-11-05"),
  },
  {
    titulo: "Analista de Datos",
    empresa: "Grupo Éxito",
    ubicacion: "Envigado, Colombia",
    modalidad: "presencial",
    nivelExperiencia: "Junior",
    salarioMin: 4000000,
    salarioMax: 5500000,
    moneda: "COP",
    descripcion:
      "Apoyarás la toma de decisiones con análisis de datos, dashboards y reportes. Deseable SQL, Python y manejo de herramientas de visualización.",
    urlOriginal: "https://ejemplo.test/vacantes/analista-datos-exito",
    fuente: "prueba",
    fechaPublicacion: new Date("2026-11-06"),
  },
  {
    titulo: "Ingeniero DevOps",
    empresa: "Nequi",
    ubicacion: "Remoto - LATAM",
    modalidad: "remoto",
    nivelExperiencia: "Senior",
    salarioMin: 9000000,
    salarioMax: 14000000,
    moneda: "COP",
    descripcion:
      "Responsable de CI/CD, infraestructura como código y observabilidad. Experiencia con Docker, Kubernetes y nubes públicas. Cultura de automatización y confiabilidad.",
    urlOriginal: "https://ejemplo.test/vacantes/devops-nequi",
    fuente: "prueba",
    fechaPublicacion: new Date("2026-11-08"),
  },
  {
    titulo: "Diseñador UX/UI",
    empresa: "Tul",
    ubicacion: "Bogotá, Colombia",
    modalidad: "híbrido",
    nivelExperiencia: "Semi Senior",
    salarioMin: 5000000,
    salarioMax: 7500000,
    moneda: "COP",
    descripcion:
      "Diseñarás experiencias centradas en el usuario: investigación, wireframes, prototipos y entrega a desarrollo. Manejo de Figma y sistemas de diseño.",
    urlOriginal: "https://ejemplo.test/vacantes/uxui-tul",
    fuente: "prueba",
    fechaPublicacion: new Date("2026-11-09"),
  },
];

async function seed() {
  const resultado = await prisma.vacante.createMany({
    data: vacantes,
    skipDuplicates: true,
  });

  const total = await prisma.vacante.count();
  console.log(`Vacantes de prueba insertadas: ${resultado.count}.`);
  console.log(`Total de vacantes en la base: ${total}.`);

  await prisma.$disconnect();
}

seed().catch((error) => {
  console.error("Error en el seed de vacantes de prueba:", error);
  process.exit(1);
});
