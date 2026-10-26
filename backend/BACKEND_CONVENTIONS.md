# Convenciones del backend

## Reglas oficiales del equipo

1. El stack oficial es NestJS + TypeScript + Prisma ORM + PostgreSQL.
2. Todos los módulos de dominio viven en `src/modules/`.
3. Cada módulo usa `Module`, `Controller`, `Service` y `dto/` según su alcance.
4. Los controladores no acceden directamente a Prisma.
5. Los servicios contienen las reglas de negocio.
6. Prisma es la capa oficial de acceso a PostgreSQL.
7. No se crean repositories adicionales sin una decisión explícita del equipo.
8. Existe un único `prisma/schema.prisma` compartido.
9. Las migraciones Prisma son compartidas y deben versionarse cuando existan.
10. El `ValidationPipe` global es obligatorio.
11. No se guardan secretos en el código.
12. Nunca se agrega `.env` al repositorio.
13. Cada integrante modifica solo su módulo y los archivos compartidos
    estrictamente necesarios.
14. No se reorganizan ni reescriben módulos ajenos.
15. No se instalan frameworks alternativos sin aprobación del equipo.
16. No se eliminan físicamente registros cuando el requisito indique baja
    lógica.
17. Se utilizan excepciones HTTP estándar de NestJS según corresponda.
18. Los nombres de rutas, archivos, clases y contratos se mantienen
    consistentes.
19. Todos los módulos deben contar con pruebas proporcionales a su alcance.
20. Antes de integrar se ejecutan build, pruebas y `npm audit`.
21. Ninguna IA debe cambiar la arquitectura general por iniciativa propia.
22. Todo cambio al esquema compartido debe revisar dependencias con otros
    módulos.

## Principios

1. Cada dominio vive en `src/modules/<dominio>` y expone un único módulo NestJS.
2. Los controladores traducen HTTP; no contienen reglas de negocio ni consultas
   de persistencia.
3. Los servicios implementan casos de uso y dependen de abstracciones o de la
   capa de datos necesaria.
4. Prisma se inyecta mediante `PrismaService`. No se instancia `PrismaClient`
   dentro de módulos de dominio.
5. `prisma/schema.prisma` es el único esquema de base de datos del proyecto.
6. No se crean carpetas vacías, capas especulativas ni abstracciones sin un uso
   concreto.

## Nombres y archivos

- Carpetas y archivos: `kebab-case`.
- Clases, DTO y tipos: `PascalCase`.
- Variables, funciones y métodos: `camelCase`.
- Módulos: `<dominio>.module.ts`.
- Controladores: `<dominio>.controller.ts`.
- Servicios: `<dominio>.service.ts`.
- DTO: `dto/<accion>-<entidad>.dto.ts`.
- Pruebas unitarias: archivo probado seguido por `.spec.ts`.
- Pruebas E2E: descripción seguida por `.e2e-spec.ts` en `test/`.

## Rutas HTTP

- Todas las rutas se publican bajo `/api` mediante el prefijo global.
- Los recursos usan nombres en español coherentes con el dominio actual.
- Los sustantivos de colección se expresan en plural.
- Los códigos de estado y métodos HTTP deben representar la operación real.
- Los controladores devuelven contratos claros; no retornan entidades internas
  de Prisma de forma accidental.

## Validación

- Los datos de entrada se representan con DTO y decoradores de
  `class-validator` cuando existan endpoints que reciban datos.
- El `ValidationPipe` global elimina propiedades no declaradas, rechaza campos
  desconocidos y transforma tipos compatibles.
- Las variables de entorno se validan al arrancar en
  `src/config/env.validation.ts`.

## Configuración y secretos

- La configuración se obtiene mediante `ConfigService`.
- `.env.example` documenta nombres y formatos, nunca credenciales reales.
- Los archivos `.env` permanecen ignorados por Git.
- No se registran cadenas de conexión, contraseñas, tokens ni datos personales.
- CORS debe mantener una lista explícita de orígenes autorizados.

## Prisma y migraciones

- Cada cambio de esquema requiere revisión antes de generar una migración.
- Las migraciones se crean con `npm run prisma:migrate:dev` y se aplican en
  despliegues con `npm run prisma:migrate:deploy`.
- No se edita una migración que ya fue compartida o aplicada.
- No se usa `db push` como sustituto de migraciones en ambientes compartidos.
- Los nombres de modelos y campos se acuerdan antes de implementarse.
- El cliente generado no se versiona; se obtiene con
  `npm run prisma:generate`.

## Pruebas y cierre de avance

Todo cambio de backend debe completar, según su alcance:

```powershell
npm run build
npm test -- --runInBand
npm run test:e2e
npm audit
```

Los servicios se prueban de manera aislada, los controladores verifican su
delegación y las pruebas E2E comprueban el contrato HTTP y el prefijo `/api`.

## Límites entre módulos

- Un módulo no importa archivos internos de otro módulo.
- Si un contrato necesita compartirse, se exporta conscientemente desde el
  módulo propietario o se mueve a `common/` cuando sea verdaderamente global.
- No se crean dependencias circulares ni `forwardRef` para ocultar límites mal
  definidos.
- Los módulos nuevos siguen `MODULE_TEMPLATE.md`.
