# Navana

App Android para gestionar el hogar en pareja: tareas de casa, lista de la compra y agenda de planes, sincronizadas en tiempo real.

El alcance, la arquitectura, el modelo de datos y las fases están en [PLAN.md](PLAN.md).

**Estado:** Fases 0 a 4 hechas (cimientos, cuenta y hogar, tareas, compra y agenda), más lo que se podía adelantar de las Fases 5 y 6: salir del hogar y eliminar la cuenta, tema oscuro, inglés, menú semanal y notas compartidas (estos dos, como módulos opcionales). Queda lo que depende de cuentas y decisiones del dueño del proyecto: ver [docs/play-store.md](docs/play-store.md).

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
| `npm run check` | `tsc`, lint, tests y tests de reglas; tiene que quedar en verde al cerrar cada fase |
| `npm run test:rules` | Tests de `firestore.rules` contra el emulador (lo arranca y lo para solo) |
| `npm run deploy:rules` | Publica `firestore.rules` en el proyecto real de Firebase (pide `firebase login`) |

En PowerShell de Windows, si `npm` falla por la política de ejecución de scripts, usa `npm.cmd` y `npx.cmd`.

La vista web no es un producto: sirve para recorrer pantallas y flujos con usuarios de prueba. Con los emuladores arrancados se entra como "Ana" o "Bruno" sin cuentas reales; para verlos a la vez, abre una pestaña en `localhost:8081` y otra en `127.0.0.1:8081` (son orígenes distintos, así que cada una guarda su sesión). Habla siempre con los emuladores (proyecto `demo-navana`), nunca con datos reales. En Ajustes hay una tarjeta "Entorno de desarrollo" que indica a qué backend se conecta la app y si responde.

## Puesta en marcha desde cero

Ya están hechos para este proyecto; se conservan como referencia por si hay que repetirlos:

1. **Firebase** (plan Spark): crear el proyecto, activar Authentication con Google y Firestore en una región europea, y registrar una app Android con el paquete `com.navana.app`.
2. Descargar `google-services.json` y dejarlo en la raíz del repo. Está en `.gitignore` porque el repo es público: no se sube a git y cada equipo necesita su copia.
3. **Expo**: crear la cuenta y ejecutar `npx eas-cli@latest login`.
4. `npx eas-cli@latest init` y pegar el ID de proyecto que devuelve en `EAS_PROJECT_ID`, dentro de [app.config.ts](app.config.ts).
5. Generar el keystore con `npx eas-cli@latest credentials -p android` y añadir su huella SHA-1 a la app Android de Firebase. Google Sign-In no funciona sin ella.
6. Volver a descargar `google-services.json` (ahora incluye los clientes OAuth) y cargarlo en EAS, que no lo recibe por git:

   ```bash
   npx eas-cli@latest env:set --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment development --environment preview --environment production
   ```

   Hay que repetir este comando cada vez que cambie el archivo.
7. Primer APK de desarrollo: `npx eas-cli@latest build --profile development --platform android`.

Los cambios de JavaScript llegan después al móvil con `npx eas-cli@latest update`, sin gastar compilaciones.

## Notificaciones

No hay servidor: los avisos salen de los propios móviles (ver "Notificaciones sin servidor" en [PLAN.md](PLAN.md)).

- **Resumen diario, tareas atrasadas y recordatorios de la agenda**: avisos locales que cada móvil se programa a sí mismo. No necesitan nada más.
- **"El otro ha completado" y "toque"**: push enviado por el móvil que actúa a través de Expo Push Service. Para que lleguen en Android hay que subir a EAS, una vez, la credencial de Firebase Cloud Messaging:
  1. Consola de Firebase → Configuración del proyecto → Cuentas de servicio → "Generar nueva clave privada". Se descarga un JSON; **no lo subas a git**.
  2. `npx eas-cli@latest credentials -p android` → perfil `development` → "Google Service Account" → "Manage your Google Service Account Key for Push Notifications (FCM V1)" → subir ese JSON.

## Documentos

- [PLAN.md](PLAN.md): alcance, arquitectura, modelo de datos y fases.
- [docs/play-store.md](docs/play-store.md): pasos y textos para publicar en Google Play.
- [docs/privacidad.md](docs/privacidad.md): borrador de la política de privacidad.

## Estructura

```
app/        rutas (Expo Router): pestañas Hoy, Tareas, Compra y Agenda; ajustes
src/
  data/     acceso a Firebase; se importa siempre desde `@/data/fb`
  domain/   lógica pura, sin React ni Firebase (desde la Fase 2)
  features/ pantallas y componentes de cada módulo
  i18n/     textos (`locales/es.json`)
  modules/  registro de módulos activables
  notifications/ avisos locales y push (detrás de `transport.ts`)
  state/    estado de sesión (Zustand)
  ui/       kit de interfaz y tokens de tema
```
