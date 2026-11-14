# Profile Manager (Magneto) - Backend API

Servicio backend de la plataforma de gestión de perfiles de empleo y recomendación de vacantes para Magneto.
Está diseñado con **Clean Architecture** (dominio, aplicación, infraestructura e interfaces) y organizado
por **verticales de negocio**, de modo que cada integrante es dueño de una parte completa del sistema.

## Stack

- Node.js + Express 5 + TypeScript
- Prisma 7 (ORM) + PostgreSQL 17
- Autenticación con JWT

## Verticales

| Vertical | Responsable | Contenido |
|---|---|---|
| A. Perfil y Autenticación | Samuel | Registro, login, perfil por pasos y completitud |
| B. Vacantes e Ingesta | Matías | Catálogo, búsqueda, filtros y carga del dataset |
| C. Recomendación y Matching | Villiam | Motor de scoring, explicación e historial |
| D. Postulación y Trazabilidad | Juan Pablo | Postulaciones y su seguimiento |

Cada capa (`src/domain`, `src/application`, `src/infrastructure`, `src/interfaces`) tiene una carpeta por vertical.
Recomendación vive en `src/recommendation`, con la misma separación de capas.

## Puesta en marcha

Requisitos: Node.js 20 o superior (el equipo usa la 24), PostgreSQL 17 y npm.

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear el archivo `.env` a partir del ejemplo y completar los valores:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL`: cadena de conexión a tu PostgreSQL local (por ejemplo `postgresql://postgres:TU_CLAVE@localhost:5432/magneto_db`).
   - `JWT_SECRET`: texto largo y secreto.
   - `PORT`: `4000`.
3. Crear la base de datos vacía (por ejemplo `magneto_db`) y aplicar las migraciones:
   ```bash
   npx prisma migrate dev
   ```
4. Cargar las vacantes (ver la sección del dataset) y arrancar el servidor:
   ```bash
   npx tsx prisma/seed-vacantes.ts
   npm run dev
   ```
5. Comprobar que responde: abrir `http://localhost:4000/health`.

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor en modo desarrollo con recarga automática |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada |

## API

| Método y ruta | Descripción | Token |
|---|---|---|
| `GET /health` | Estado del servicio | No |
| `POST /auth/registro` | Crear cuenta | No |
| `POST /auth/login` | Iniciar sesión (devuelve token y `usuarioId`) | No |
| `GET /perfil` | Perfil con porcentaje de completitud y desglose por sección | Sí |
| `PUT /perfil/paso/:paso` | Guardar un paso del perfil: `datos-personales`, `experiencia`, `educacion`, `habilidades` o `preferencias` | Sí |
| `GET /vacantes` | Catálogo paginado. Parámetros: `pagina`, `limite`, `ubicacion`, `modalidad`, `nivelExperiencia`, `salarioMin`, `salarioMax`, `q` (búsqueda de texto) | No |
| `GET /vacantes/:id` | Detalle de una vacante | No |
| `GET /recomendaciones/:usuarioId` | Vacantes recomendadas con puntaje, motivos y desglose | No |
| `GET /recomendaciones/:usuarioId/historial` | Historial de recomendaciones | No |
| `POST /postulaciones` | Postularse a una vacante (`usuarioId`, `vacanteId`). Si ya existe, devuelve `409` | No |
| `GET /postulaciones/:usuarioId` | Postulaciones del usuario | No |
| `PATCH /postulaciones/:id/estado` | Cambiar el estado de una postulación (`estado`: `POSTULADO`, `EN_REVISION`, `ENTREVISTA`, `DESCARTADO`) | No |
| `GET /postulaciones/:id/actividad` | Registro de actividad (trazabilidad) de una postulación | No |
| `GET /notificaciones/:usuarioId` | Notificaciones del usuario (`?soloNoLeidas=true` para filtrar) | No |
| `PATCH /notificaciones/:id/leida` | Marcar una notificación como leída (`usuarioId` en el cuerpo) | No |

## Dataset de vacantes

Las vacantes se cargan con `prisma/seed-vacantes.ts` desde `data/postings.csv`, un archivo que **no está en el
repositorio** (pesa más de 100 MB). El dataset actual es "LinkedIn Job Postings (2023-2024)" de Kaggle
(`arshkon/linkedin-job-postings`): más de 100.000 registros, de Estados Unidos y en inglés. Se usó porque el reto
permite datasets públicos cuando no hay acceso a las vacantes reales de Magneto. La carga se puede repetir sin
duplicar registros, porque cada vacante tiene su URL original como valor único.

## Trabajo en equipo

- Cada cambio va en una rama propia creada desde `main` y entra por Pull Request con revisión de otra vertical.
  Nadie sube directo a `main`.
- El `prisma/schema.prisma` es compartido: avisen en el grupo antes de modificarlo e incluyan la migración en el
  mismo PR. Antes de hacer commit revisen `git status`, para no subir migraciones generadas por accidente.
- Después de cada `git pull`: `npm install`, `npx prisma generate` y `npx prisma migrate dev`. Si Prisma pide
  reiniciar la base, `npx prisma migrate reset` borra los datos locales y vuelve a aplicar todo.

## Estado y pendientes

- Cambiar el estado de una postulación (en revisión, entrevista, descartado), notificaciones y registro de
  actividad: implementado (vertical D). Los botones del tablero del frontend usan `PATCH /postulaciones/:id/estado`;
  cada cambio genera una notificación y una entrada en el registro de actividad.
- Pesos configurables del recomendador, descartar vacantes y revisión de la fórmula del puntaje con el nuevo
  dataset: pendientes (vertical C).
- Dataset de vacantes de Colombia, en español, con salarios en COP: pendiente (vertical B).
- Solo las rutas de `/perfil` exigen token; falta protegerlas en el resto.
- Pruebas automatizadas: pendientes.