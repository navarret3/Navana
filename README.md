# Navana

App Android para gestionar el hogar en pareja: tareas de casa, lista de la compra y agenda de planes, sincronizadas en tiempo real.

El alcance, la arquitectura, el modelo de datos y las fases están en [PLAN.md](PLAN.md).

**Estado:** Fase 0 (cimientos) hecha, a falta de los pasos manuales de abajo y del primer APK de desarrollo.

## Requisitos

- Node 20 o superior y git.
- Java 17 o superior, solo para los emuladores de Firebase.
- `npm config get registry` debe devolver `https://registry.npmjs.org/` (EAS Build no instala desde registros privados).

## Día a día

```bash
npm install
```

| Comando | Qué hace |
| --- | --- |
| `npm run web` | Vista web de desarrollo en http://localhost:8081 (usa los emuladores) |
| `npm run emulators` | Emuladores de Firebase: Auth (9099), Firestore (8080) y su panel (4000) |
| `npm start` | Servidor de desarrollo para el móvil (necesita el APK de desarrollo) |
| `npm run check` | `tsc`, lint y tests; tiene que quedar en verde al cerrar cada fase |

La vista web no es un producto: sirve para recorrer pantallas y flujos con usuarios de prueba. Habla siempre con los emuladores (proyecto `demo-navana`), nunca con datos reales. En Ajustes hay una tarjeta "Entorno de desarrollo" que indica a qué backend se conecta la app y si responde.

## Pasos manuales pendientes (Fase 0)

Hacen falta una vez, antes del primer APK:

1. **Firebase** (plan Spark): crear el proyecto, activar Authentication con Google y Firestore en una región europea, y registrar una app Android con el paquete `com.navana.app`.
2. Descargar `google-services.json` y dejarlo en la raíz del repo. No contiene secretos; si se prefiere no subirlo a git, añadirlo a `.gitignore` y cargarlo en EAS como variable de entorno de tipo fichero llamada `GOOGLE_SERVICES_JSON`.
3. **Expo**: crear la cuenta y ejecutar `npx eas-cli@latest login`.
4. `npx eas-cli@latest init` y pegar el ID de proyecto que devuelve en `EAS_PROJECT_ID`, dentro de [app.config.ts](app.config.ts).
5. Primer APK de desarrollo: `npx eas-cli@latest build --profile development --platform android`.
6. Añadir a la app Android de Firebase la huella SHA-1 del keystore (`npx eas-cli@latest credentials`). Google Sign-In no funciona sin ella.

Los cambios de JavaScript llegan después al móvil con `npx eas-cli@latest update`, sin gastar compilaciones.

## Estructura

```
app/        rutas (Expo Router): pestañas Hoy, Tareas, Compra y Agenda; ajustes
src/
  data/     acceso a Firebase; se importa siempre desde `@/data/fb`
  domain/   lógica pura, sin React ni Firebase (desde la Fase 2)
  features/ pantallas y componentes de cada módulo
  i18n/     textos (`locales/es.json`)
  modules/  registro de módulos activables
  state/    estado de sesión (Zustand)
  ui/       kit de interfaz y tokens de tema
```
