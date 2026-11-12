# Publicar Navana en Google Play

Lo que hace falta para la Fase 5 del [plan](../PLAN.md) y que solo se puede hacer con tu
cuenta. Los textos son borradores para copiar y ajustar.

## Antes de empezar

1. **Cuenta de Play Console**: 25 $, pago único.
2. **Prueba cerrada**: a las cuentas personales nuevas Google les pide una prueba cerrada
   con un mínimo de testers durante 14 días antes de poder publicar en producción. Confirma
   la cifra vigente al crear la cuenta (el plan anotaba unos 12) y ve reuniendo testers.
3. **Nombre**: comprueba que "Navana" no choca con otra app o marca. El identificador
   `com.navana.app` no se puede cambiar una vez subida.
4. **Política de privacidad**: publica [privacidad.md](privacidad.md) en una URL pública
   (GitHub Pages sirve) después de rellenar los corchetes.

## Compilar y subir

```bash
npx eas-cli@latest build --profile production --platform android
```

Genera el AAB. Se sube a mano en Play Console la primera vez; después se puede usar
`npx eas-cli@latest submit`.

Al activar **Play App Signing**, Google firma la app con su propia clave. Hay que copiar el
SHA-1 de esa clave (Play Console → Integridad de la app) y añadirlo a la app Android en la
consola de Firebase, igual que se hizo con el del keystore de EAS. Sin eso, el inicio de
sesión con Google falla en la versión descargada de la tienda.

## Ficha de la tienda

**Nombre**: Navana

**Descripción breve** (máx. 80 caracteres):

> La casa en pareja: tareas, compra y planes compartidos.

**Descripción completa**:

> Navana ordena lo que da pereza de vivir juntos: quién limpia qué, qué falta en la nevera y
> qué planes tenéis a la vista.
>
> TAREAS DE CASA
> • Reparto por turnos, fijo o libre, tarea a tarea.
> • Siempre "cada X días desde la última vez", para que hacerlo tarde no acumule retraso.
> • Apunta con un toque lo que surge sin planear: barrer, tender, fregar los platos.
> • Un balance del esfuerzo de cada uno, sin puntos ni competición.
>
> LISTA DE LA COMPRA
> • Compartida y al momento. Funciona sin cobertura en el súper.
> • Autocompletar, categorías automáticas y vuestros productos frecuentes.
>
> AGENDA
> • Viajes, conciertos, citas y eventos, de uno, del otro o de los dos.
> • Recordatorios y cuenta atrás para el próximo plan.
>
> Y si queréis: menú semanal que pasa sus ingredientes a la compra y notas compartidas.
>
> Sin anuncios.

**Categoría**: Casa y hogar (alternativa: Productividad).

**Material gráfico pendiente**: icono de 512 × 512, imagen destacada de 1024 × 500 y al menos
dos capturas de pantalla de móvil. El icono actual es provisional.

## Formulario de seguridad de los datos

Respuestas según lo que hace la app hoy. Revísalas si cambia algo.

| Pregunta | Respuesta |
| --- | --- |
| ¿Recoge o comparte datos de los usuarios? | Sí, recoge. No comparte con terceros. |
| ¿Se cifran en tránsito? | Sí. |
| ¿Se puede pedir que se eliminen? | Sí: dentro de la app y por correo. |
| Nombre | Recogido. Funcionamiento de la app. Obligatorio. |
| Foto | Recogida (la de la cuenta de Google). Funcionamiento de la app. |
| Identificadores de usuario | Recogidos. Funcionamiento de la app y gestión de la cuenta. |
| Otro contenido generado por el usuario (tareas, lista, eventos, notas) | Recogido. Funcionamiento de la app. |
| Identificadores del dispositivo (token de notificaciones) | Recogidos. Funcionamiento de la app. |
| Ubicación, contactos, datos financieros, de salud, mensajes | No se recogen. |
| Publicidad o analítica | No. |

**Eliminación de la cuenta**: Play pide una URL donde solicitarla sin tener la app instalada.
Sirve la sección "Cómo eliminar tus datos" de la política de privacidad.

## Antes de abrirla al público

El plan deja dos cosas para este momento, porque hoy la app está pensada para dos personas:

- **Notificaciones desde servidor.** Ahora las envía el propio móvil que actúa. Para una app
  pública hay que pasarlas a Cloud Functions, lo que exige el plan Blaze de Firebase (con
  tarjeta). El código ya las tiene aisladas en `src/notifications/transport.ts`.
- **App Check**, para que solo la app auténtica pueda hablar con Firebase.
