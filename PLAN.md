# Navana — plan de la app

Nov 12, 2026 · @Nava

Navana es una app Android para gestionar el hogar en pareja: tareas de casa, lista de la compra y agenda de planes, sincronizadas en tiempo real. El plan está aprobado y todavía no se ha creado código; el desarrollo se hará en otro equipo.

Resuelve tres fricciones de vivir juntos: no está claro quién limpia qué ni qué toca cada día, la compra se apunta de forma dispersa y los planes en común no están en un sitio compartido.

## Cómo retomarlo en otro equipo

Este documento es autocontenido: basta con guardarlo como `PLAN.md` en la carpeta del proyecto nuevo.

1. Instalar los requisitos: Node LTS (20 o superior), git y Java 17 o superior (solo para los emuladores de Firebase). Android Studio es opcional: las compilaciones se hacen en la nube con EAS.
2. Comprobar que `npm config get registry` devuelve `https://registry.npmjs.org/`. EAS Build compila en la nube y no puede instalar desde registros privados.
3. Crear una carpeta vacía, exportar este documento a Markdown (clic en el nombre del documento, Export, Markdown) como `PLAN.md` dentro de ella y abrirla con Claude Code.
4. Pedirle: «Lee PLAN.md y empieza por la Fase 0».

Cuentas gratuitas que hay que crear a mano: Firebase (plan Spark) y Expo. Para publicar hará falta además Google Play Console (25 $, pago único).

## Decisiones tomadas

| Tema | Decisión |
| --- | --- |
| Plataforma | Android (los dos). Stack multiplataforma por si llega iOS |
| Stack | React Native + Expo + TypeScript (Expo Router) |
| Backend | Firebase plan gratuito (Spark): Auth + Firestore. Sin Cloud Functions, para no dar tarjeta |
| Acceso | Google Sign-In + código o enlace de invitación al hogar |
| Alcance | Para los dos, modelada con "hogares" para hacerla pública después |
| Reparto de tareas | Mixto por tarea: fija, rotación o libre |
| Recurrencia | Siempre "cada X días desde la última vez que se hizo", más tareas puntuales |
| Motivación | Balance de equidad por esfuerzo, sin puntos ni competición |
| Avisos | Resumen diario, cuando el otro completa, tareas atrasadas y "toque" |
| Compra | Tiempo real, autocompletar y frecuentes, categorías automáticas. Una sola lista |
| Agenda | Calendario propio (sin Google Calendar), recordatorios, cuenta atrás, citas y gestiones |
| Personalización | Tareas y zonas propias, módulos activables |
| Diseño | Cálido y divertido, con guiños a los gatos |
| Idioma | Español, con textos separados (i18n) para añadir idiomas |
| Orden | Primero tareas, luego compra, luego agenda |
| Futuro | Menú semanal, notas compartidas |
| Nombre | Navana (`applicationId` propuesto: `com.navana.app`) |

Descartado a propósito: puntos y recompensas, varias listas de compra, cantidades y notas por producto, sincronización con Google Calendar, lista de ideas de planes, gastos compartidos, ficha de los gatos, personalización de apariencia y de categorías.

## Arquitectura

- **App**: Expo (última SDK estable, se fija al crear el proyecto con `create-expo-app@latest`) + Expo Router con pestañas Hoy, Tareas, Compra y Agenda; ajustes desde el avatar.
- **Firebase nativo** (`@react-native-firebase/app`, `auth`, `firestore`): da caché offline en disco, imprescindible para usar la compra en el súper sin cobertura. Implica *development build*, no Expo Go.
- **Login**: `@react-native-google-signin/google-signin` y credencial de Firebase Auth.
- **Compilación**: EAS Build en la nube. APK "preview" instalado en los dos móviles y EAS Update para mandar cambios sin reinstalar.
- **Módulos activables**: registro en `src/modules/registry.ts` (id, icono, pestaña, tarjeta para "Hoy"); `household.enabledModules` decide qué se muestra. Menú semanal y notas se enchufan aquí.
- **Lógica de dominio pura** en `src/domain/`, sin React ni Firebase, para poder testearla.
- **Vista web solo de desarrollo**: la capa de datos importa Firebase desde un shim (`src/data/fb.native.ts` usa el SDK nativo, `fb.web.ts` el SDK JS contra emuladores locales). Permite comprobar pantallas y flujos en el navegador sin depender del móvil. No es un producto web.
- **UI**: kit propio pequeño con tokens de tema (`src/ui/`), Reanimated + Gesture Handler, `@gorhom/bottom-sheet`, `react-native-calendars`, `date-fns` (es), `i18next` + `expo-localization`, Zustand para el estado de sesión.

### Notificaciones sin servidor

Al no usar el plan Blaze no hay Cloud Functions, así que los avisos salen de los propios móviles.

- **Cuando el otro completa y "toque"**: el móvil que actúa envía el push al otro mediante Expo Push Service. Los tokens se guardan en el hogar y solo los leen sus miembros.
- **Resumen diario, atrasadas y recordatorios de agenda**: notificaciones locales que cada móvil reprograma cuando cambian los datos o se abre la app.
- Todo va detrás de una interfaz (`src/notifications/transport.ts`) para poder cambiarla por Cloud Functions sin tocar el resto.
- **Límite conocido**: si tu pareja completa algo y tu móvil no se entera a tiempo, tu resumen puede salir desfasado. Es aceptable para dos; hay que migrarlo a servidor antes de hacerla pública.

### Estructura de carpetas

```
app/                    rutas (Expo Router)
  (auth)/sign-in        (onboarding)/create-or-join, setup-tasks
  (tabs)/index (Hoy), tasks, shopping, agenda
  task/[id], task/new   event/[id], event/new
  settings/ (hogar, miembros, zonas, módulos, avisos)
src/
  domain/   tasks/{recurrence,rotation,balance}.ts  shopping/{categorize.ts,seedCatalog.es.json}  agenda/reminders.ts
  data/     fb.native.ts, fb.web.ts, households.ts, invites.ts, tasks.ts, shopping.ts, events.ts
  features/ today/ tasks/ shopping/ agenda/ household/
  modules/registry.ts
  notifications/ transport.ts, expoPush.ts, localPlanner.ts
  ui/  i18n/locales/es.json  state/session.ts
firestore.rules  firestore.indexes.json  firebase.json  tests/rules/
app.config.ts  eas.json
```

### Modelo de datos (Firestore)

```
users/{uid}                      nombre, foto, householdId, ajustes de avisos (hora del resumen…)
invites/{code}                   householdId, creador, caducidad
households/{hid}                 nombre, icono, memberIds[], enabledModules{}
  members/{uid}                  nombre, color, avatar, pushTokens[]
  zones/{id}                     nombre, icono, orden
  tasks/{id}                     título, icono, zoneId, esfuerzo(1-3), modo(fixed|rotation|free),
                                 assigneeId, rotationOrder[], intervalDays|null, nextDueOn(YYYY-MM-DD),
                                 lastCompletedAt/By, archived
  completions/{id}               taskId, título, esfuerzo, zoneId, completedBy, completedAt,
                                 estado previo de la tarea (para deshacer)
  shoppingItems/{id}             nombre, categoryId, checked, addedBy, checkedBy, fechas
  catalog/{nombreNormalizado}    nombre, categoryId, timesBought, lastBoughtAt
  events/{id}                    título, tipo(plan|cita|cumpleaños), inicio/fin, allDay, lugar, notas,
                                 participantes[], recordatorios[min], repetición anual
```

Reglas de seguridad: solo los miembros (`memberIds`) leen y escriben su hogar; unirse exige una invitación válida y no caducada; cada usuario solo toca su `users/{uid}`.

## Funcionalidad por módulo

### Tareas

- Alta y edición con icono, zona, esfuerzo, frecuencia (cada X días o puntual) y modo (fija, rotación, libre).
- Plantilla inicial en el onboarding: cocina, baño, fregar, aspirar, arenero, basura, lavadora, sábanas. Se marcan las que se quieran.
- Completar es una escritura atómica: registra quién la hizo, pone `nextDueOn = hoy + intervalDays` y, en rotación, pasa el turno al siguiente de quien la hizo.
- "La hice yo" aunque fuera del otro. Deshacer y posponer.
- Pantalla Hoy: mis tareas de hoy y atrasadas, las libres, las de la pareja (plegadas), próximo plan con cuenta atrás y resumen de la compra.
- Balance de equidad: reparto del esfuerzo por semana o mes y por zona, en tono neutro. Historial de quién hizo qué.

### Compra

- Barra de añadir siempre a mano; autocompletar con el historial del hogar y un diccionario inicial de unos 300 productos en español.
- Categoría automática: primero lo aprendido en el hogar, luego el diccionario y, si no, "Otros". Si se corrige una categoría, se recuerda.
- Chips de frecuentes y recién tachados para volver a añadir con un toque.
- "Terminar compra" limpia lo tachado y actualiza las frecuencias.
- Sincronización en vivo y funcionamiento offline.

### Agenda

- Vista de mes y lista de próximos.
- Tipos: plan juntos, cita o gestión (individual o del hogar: veterinario, médico, facturas) y cumpleaños (anual).
- Recordatorios configurables (1 día, 1 hora) como notificaciones locales en el móvil de cada participante.
- Cuenta atrás en "Hoy".

## Fases

Se construye en este orden; el primer hito usable llega al final de la Fase 2, con la app instalada en los dos móviles.

- **Fase 0 — Cimientos.** `git init`, proyecto Expo con TypeScript estricto, ESLint y Jest. Tema cálido (paleta crema, melocotón y salvia; tipografía redondeada), kit de UI, i18n, esqueleto de navegación, shim de Firebase y emuladores. Configuración de EAS y primer APK de desarrollo.
  - A mano: crear el proyecto Firebase (Auth con Google, Firestore en región europea, app Android `com.navana.app`), crear la cuenta de Expo y hacer `eas login`, añadir el SHA-1 del keystore a Firebase.
- **Fase 1 — Cuenta y hogar.** Google Sign-In, crear hogar o unirse con código o enlace, perfil de miembro (color, avatar), registro de módulos y ajustes, reglas de Firestore con tests.
- **Fase 2 — Tareas.** Zonas y tareas, plantilla inicial, modos de reparto, completar, deshacer y posponer, pantalla Hoy, historial y balance, notificaciones (push al otro, resumen diario, atrasadas, toque).
- **Fase 3 — Compra.** Lo descrito en el módulo de compra.
- **Fase 4 — Agenda.** Lo descrito en el módulo de agenda.
- **Fase 5 — Pulido y Play Store.** Icono, splash, ilustraciones y estados vacíos, animaciones al completar, accesibilidad, errores y offline.
  - Para publicar: cuenta de Play Console (25 $, pago único), política de privacidad publicada, borrado de cuenta dentro de la app (lo exige Google), formulario de seguridad de datos, AAB de producción, SHA-1 de Play App Signing en Firebase y ficha de la tienda.
  - Migrar las notificaciones a servidor (reabre la decisión del plan Blaze) y activar App Check.
- **Fase 6 — Futuro.** Menú semanal (los ingredientes pasan a la compra), notas compartidas, widget de Android, tema oscuro, inglés.

## Verificación

Cada fase termina con `tsc`, lint y tests en verde y un APK o actualización instalable.

- **Tests unitarios** (Jest) de `src/domain`: cálculo de la próxima fecha, rotación, balance, categorización y planificación de recordatorios.
- **Tests de reglas** con `@firebase/rules-unit-testing` en el emulador: un no-miembro no lee ni escribe; unirse solo funciona con una invitación válida.
- **Web de desarrollo con emuladores**: recorrer cada flujo en el navegador con dos usuarios de prueba. Crear hogar, invitar, crear tarea, completar y ver el balance; compra en dos pestañas a la vez; evento con recordatorio.
- **En los dos móviles**, lo que solo se puede probar ahí: Google Sign-In real, push entre los dos, notificaciones locales a su hora, modo avión en la compra y resincronización.

## Riesgos y puntos abiertos

- **Requisito de Play para cuentas personales nuevas**: prueba cerrada con unos 12 testers durante 14 días antes de producción. Hay que confirmar la cifra vigente al crear la cuenta y reunir testers.
- **Nombre "Navana"**: comprobar que no choca con otra app o marca antes de publicar. El `applicationId` no se puede cambiar tras subirla.
- **Versiones**: sin verificar todavía. Se fijan al crear el proyecto y se comprueba la compatibilidad de React Native Firebase y Google Sign-In con esa SDK de Expo.
- **Ilustraciones**: se empieza con SVG sencillos y emojis; un arte más elaborado sería un trabajo aparte.
- **Límite de builds gratuitos de EAS**: suficiente para este ritmo; los cambios de JS van por EAS Update sin gastar builds.
