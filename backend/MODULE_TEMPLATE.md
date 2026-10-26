# Plantilla para módulos

Esta guía describe la estructura mínima para un módulo nuevo. Solo deben
crearse archivos requeridos por el caso de uso aprobado.

## Estructura sugerida

```text
src/modules/<dominio>/
├── dto/
│   └── <accion>-<entidad>.dto.ts
├── <dominio>.controller.ts
├── <dominio>.controller.spec.ts
├── <dominio>.module.ts
├── <dominio>.module.spec.ts
├── <dominio>.service.ts
└── <dominio>.service.spec.ts
```

No crear `entities/`, `repositories/`, `interfaces/` u otras carpetas hasta que
contengan una responsabilidad necesaria y una implementación real.

## Módulo

```ts
import { Module } from '@nestjs/common';
import { EjemploController } from './ejemplo.controller.js';
import { EjemploService } from './ejemplo.service.js';

@Module({
  controllers: [EjemploController],
  providers: [EjemploService],
})
export class EjemploModule {}
```

Registrar después el módulo en `AppModule`. `PrismaModule` es global y no debe
importarse repetidamente.

## Controlador

```ts
import { Controller, Get } from '@nestjs/common';
import { EjemploService } from './ejemplo.service.js';

@Controller('ejemplos')
export class EjemploController {
  constructor(private readonly ejemploService: EjemploService) {}

  @Get('status')
  getStatus() {
    return this.ejemploService.getStatus();
  }
}
```

El controlador se limita a decoradores HTTP, extracción de parámetros y
delegación al servicio.

## Servicio

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class EjemploService {
  getStatus() {
    return { module: 'ejemplo', status: 'ok' as const };
  }
}
```

Cuando el caso de uso requiera persistencia, inyectar `PrismaService`; no crear
un segundo cliente ni un segundo esquema.

## DTO

- Definir únicamente campos aceptados por el endpoint.
- Aplicar decoradores de `class-validator` a toda entrada externa.
- Separar DTO de creación, actualización, consulta y respuesta cuando sus
  contratos sean distintos.
- Nunca incluir secretos o datos ajenos al contrato público.

## Lista de verificación

- [ ] Confirmar el alcance y el contrato antes de programar.
- [ ] Crear el módulo.
- [ ] Registrar el módulo en `AppModule`.
- [ ] Definir el modelo Prisma únicamente cuando corresponda.
- [ ] Crear y revisar la migración cuando exista un cambio de esquema.
- [ ] Crear solo los DTO necesarios.
- [ ] Crear el controlador.
- [ ] Crear el servicio.
- [ ] Crear pruebas unitarias y E2E proporcionales al alcance.
- [ ] Ejecutar `npm run build`.
- [ ] Ejecutar las pruebas.
- [ ] Ejecutar `npm audit`.
- [ ] Revisar `git diff` y confirmar que no contiene secretos ni artefactos.
- [ ] No modificar innecesariamente otros módulos ni el frontend.
