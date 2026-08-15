# Profile Manager (Magneto) - Backend API

Servicio backend para la plataforma de gestión de perfiles de empleo y recomendaciones. 
Diseñado bajo los principios de **Clean Architecture** (Domain, Application, Infrastructure, Interfaces) 
y organizado por **Verticales de Negocio** para facilitar el desarrollo en equipo.

## Stack Tecnológico
- **Lenguaje:** TypeScript / Node.js
- **Framework Web:** Express.js
- **ORM & BD:** Prisma ORM + PostgreSQL
- **Autenticación:** JWT (JSON Web Tokens)

##  Estructura por Verticales
- **Vertical A:** Perfil & Autenticación (Onboarding, Login, JWT)
- **Vertical B:** Vacantes & Ingesta (Dataset Kaggle, Filtros)
- **Vertical C:** Recomendación & Matching (Motor de Scoring Baseline)
- **Vertical D:** Postulación & Trazabilidad (Registro y Estados de aplicación)

## Vertical B — Vacantes & Ingesta de datos

**Dataset:** Se utilizó el dataset público "LinkedIn Job Postings (2023-2024)"
de Kaggle (`arshkon/linkedin-job-postings`), cargado mediante `prisma/seed-vacantes.ts`.
Esta es una de las alternativas explícitamente permitidas por el documento del reto,
dado que los equipos no tienen acceso a vacantes reales de Magneto.

**Trade-off:** el dataset es de EE. UU. y está en inglés, no es de Colombia. Se eligió
por su volumen (~122,000 registros) y calidad de campos (ubicación, modalidad, salario,
nivel de experiencia), que permiten probar filtros y paginación de forma realista.

**Endpoint:** `GET /vacantes?pagina=&limite=&ubicacion=&modalidad=`
- Paginado, 20 resultados por página por defecto (máx. 100).
- Filtro `ubicacion`: coincidencia parcial, insensible a mayúsculas.
- Filtro `modalidad`: `remoto` o `presencial`.

**Cómo correr el seed localmente:**
1. Descargar `postings.csv` del dataset de Kaggle y ponerlo en `data/postings.csv`.
2. `npm install`
3. `npx prisma migrate dev`
4. `npx tsx prisma/seed-vacantes.ts`