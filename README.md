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
