# Colegio Manantial API

Base oficial del backend del Sistema de Gestión Escolar Colegio Manantial. La
aplicación usa NestJS, TypeScript, Prisma ORM y PostgreSQL, con módulos por
dominio y una única fuente de esquema en `prisma/schema.prisma`.

Esta entrega contiene infraestructura, salud y un módulo de referencia de
Profesores. No contiene CRUD, modelos de negocio, datos simulados ni lógica de
Calificaciones.

## Arquitectura propuesta para el equipo

```text
Angular
   ↓
NestJS
   ↓
Prisma ORM
   ↓
PostgreSQL
```

- **Angular** presenta la interfaz web y consume la API.
- **NestJS** publica la API y organiza la lógica de negocio por módulos.
- **Prisma ORM** ofrece acceso tipado y controlado a los datos.
- **PostgreSQL** conserva la información de forma persistente.

## Requisitos

- Node.js 24 o una versión activa compatible con NestJS 12.
- npm 11.
- PostgreSQL disponible localmente.

## Configuración local

1. Copiar `.env.example` como `.env`.
2. Sustituir el usuario, contraseña, host, puerto y base de datos de
   `DATABASE_URL` por valores locales.
3. Instalar dependencias con `npm install`.
4. Generar Prisma Client con `npm run prisma:generate`.
5. Iniciar el servidor con `npm run start:dev`.

`.env` nunca debe agregarse al repositorio. La aplicación valida al iniciar que
`NODE_ENV`, `PORT` y `DATABASE_URL` tengan un formato válido.

## Endpoints iniciales

| Método | Ruta | Propósito |
| --- | --- | --- |
| GET | `/api/health` | Verifica que la API esté disponible. |
| GET | `/api/profesores/status` | Verifica el módulo de referencia. |

El prefijo global es `/api`. CORS acepta únicamente
`http://localhost:4200`. Helmet y el `ValidationPipe` global están habilitados.

## Scripts

| Comando | Acción |
| --- | --- |
| `npm run start:dev` | Ejecuta NestJS en modo watch. |
| `npm run build` | Genera Prisma Client y compila la aplicación. |
| `npm test -- --runInBand` | Ejecuta las pruebas unitarias en serie. |
| `npm run test:e2e` | Ejecuta las pruebas HTTP de extremo a extremo. |
| `npm run prisma:generate` | Genera Prisma Client. |
| `npm run prisma:validate` | Valida configuración y esquema Prisma. |
| `npm run prisma:format` | Formatea el esquema Prisma. |
| `npm run prisma:migrate:dev` | Crea y aplica una migración de desarrollo. |
| `npm run prisma:migrate:deploy` | Aplica migraciones existentes. |
| `npm run prisma:studio` | Abre Prisma Studio. |

No se debe crear una migración hasta que exista un modelo de negocio aprobado.

## Estructura

```text
backend/
├── prisma/
│   └── schema.prisma
├── scripts/
│   └── run-tests.mjs
├── src/
│   ├── common/
│   │   └── constants/
│   ├── config/
│   ├── database/
│   ├── modules/
│   │   ├── health/
│   │   └── profesores/
│   │       └── dto/
│   ├── app.config.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
├── .env.example
├── BACKEND_CONVENTIONS.md
├── MODULE_TEMPLATE.md
├── package.json
└── prisma7.config.ts
```

Los directorios comunes para filtros, interceptores y pipes se crearán cuando
exista una implementación compartida real; no se mantienen carpetas vacías.

## Documentación de desarrollo

- [Convenciones del backend](./BACKEND_CONVENTIONS.md)
- [Plantilla para módulos](./MODULE_TEMPLATE.md)

## Seguridad y alcance

- No almacenar secretos en el código, pruebas o documentación.
- No registrar contraseñas, tokens ni cadenas de conexión.
- No exponer Prisma directamente desde controladores.
- Mantener la lógica de negocio en servicios y la persistencia en la capa que
  corresponda cuando sea autorizada.
- Agregar únicamente dependencias necesarias y revisar `npm audit` en cada
  avance.
