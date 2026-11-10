# Colegio Manantial — Frontend de inicio de sesión

Proyecto Angular con **solo la funcionalidad de inicio de sesión**. Preparado para integrar desde la rama `feature/inicio-de-sesion` sin reemplazar los módulos académicos del equipo.

## Ejecutar

Requiere Node.js compatible con Angular 21. Desde esta carpeta:

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200/login`.

El backend de autenticación debe estar ejecutándose independientemente en `http://localhost:3000`. No se incluye ni se modifica aquí.

```powershell
npm run build
```

## Lo que incluye

- Login con validación de correo y contraseña usando el servicio existente `POST /api/auth/login`.
- Mostrar/ocultar contraseña, estados de carga, mensajes de error y recuperación por `POST /api/auth/reset-password`.
- Componente independiente `src/app/pages/login/` y servicio `src/app/services/auth.service.ts`.
- Logo local en `public/images/`.

## Alcance

Esta rama **no incluye** Grados y Grupos ni otros módulos académicos. El login conserva la navegación a `/grados-y-grupos` cuando esa ruta exista en la aplicación integrada; de lo contrario muestra un mensaje después de validar correctamente.

**Para Codex / Scrum Master:** leer `INTEGRACION_CODEX.md` antes de integrar. Deben conservarse las rutas y estructura del frontend del equipo, en lugar de reemplazarse por esta aplicación aislada.

No subir `.env`, claves, credenciales, `node_modules`, `.git`, `.angular` o `dist`.
