# Profile Manager (Magneto) - Backend API

Servicio backend de la plataforma de gestión de perfiles de empleo y recomendación de vacantes para Magneto.
Está diseñado con **Clean Architecture** (dominio, aplicación, infraestructura e interfaces) y organizado
por **verticales de negocio**, de modo que cada integrante es dueño de una parte completa del sistema.

## Stack

- Node.js + Express 5 + TypeScript
- Prisma 7 (ORM) + PostgreSQL 17
- Autenticación con JWT
- **Documentación:** OpenAPI/Swagger (`swagger-jsdoc` + `swagger-ui-express`)
- **Testing:** Vitest + Supertest (Integración y Unitarias)

## Verticales

| Vertical | Responsable | Contenido |
|---|---|---|
| A. Perfil y Autenticación | Samuel | Registro, login, limitadores de peticiones (rate limiting), perfil por pasos y completitud |
| B. Vacantes e Ingesta | Matías | Catálogo, búsqueda *full-text* con índice GIN, filtros, carga del dataset de Colombia, OpenAPI y pruebas de integración |
| C. Recomendación y Matching | Villiam | Motor de scoring, explicación e historial |
| D. Postulación y Trazabilidad | Juan Pablo | Postulaciones, su seguimiento y notificaciones |

Cada capa (`src/domain`, `src/application`, `src/infrastructure`, `src/interfaces`) tiene una carpeta por vertical.
Recomendación vive en `src/recommendation`, con la misma separación de capas. Las pruebas están unificadas en la carpeta raíz `tests/`.

## Puesta en marcha

Requisitos: Node.js 20 o superior (el equipo usa la 24), PostgreSQL 17 y npm.

1. Instalar dependencias:
   ```bash
   npm install
