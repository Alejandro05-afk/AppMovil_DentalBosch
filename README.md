# DentalBosch 🦷

App móvil de gestión de clínica dental construida con **Expo (React Native)**, arquitectura **Feature-Sliced Design (FSD)**, y backend REST propio desplegado en Render. Soporta dos roles: **paciente** y **doctor**, con agenda de citas, historial clínico, notificaciones push y recordatorios locales.

---

## Índice

- [Stack técnico](#stack-técnico)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución](#ejecución)
- [Builds con EAS](#builds-con-eas)
- [Notificaciones push](#notificaciones-push)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Roles y cuentas](#roles-y-cuentas)
- [🔑 Credenciales de prueba](#-credenciales-de-prueba)
- [Scripts disponibles](#scripts-disponibles)
- [Problemas comunes](#problemas-comunes)

---

## Stack técnico

| Categoría | Tecnología |
|---|---|
| Framework | Expo SDK 54 (React Native 0.81, React 19) |
| Routing | Expo Router (file-based) |
| Arquitectura | Feature-Sliced Design (FSD) |
| Estilos / UI | NativeWind (Tailwind) + Tamagui |
| Formularios | TanStack Form + Zod |
| Autenticación | JWT propio |
| Notificaciones | expo-notifications (push + locales) |
| Almacenamiento local | AsyncStorage |
| Backend | REST API en Render (repositorio separado) |
| Lenguaje | TypeScript |

---

## Requisitos previos

Antes de clonar el proyecto, instala:

- **Node.js** 20 LTS o superior → [nodejs.org](https://nodejs.org)
- **npm** (viene con Node) o **yarn**
- **Git**
- **Expo CLI** (no requiere instalación global, se usa vía `npx`)
- **EAS CLI** para builds nativos:
  ```bash
  npm install -g eas-cli
  ```
- Cuenta en [expo.dev](https://expo.dev) (necesaria para builds y push notifications)
- Un dispositivo físico Android/iOS o un emulador/simulador configurado

> ⚠️ **Importante:** esta app usa módulos nativos (Google Sign-In, notificaciones push, date picker nativo) que **no funcionan en Expo Go**. Necesitas un **development build** propio (ver sección [Builds con EAS](#builds-con-eas)).

---

## Instalación

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd DentalBosch
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Copia el archivo de variables de entorno de ejemplo:
   ```bash
   cp .env.example .env
   ```
   (En Windows PowerShell: `copy .env.example .env`)

4. Completa los valores en `.env` (ver siguiente sección).

---

## Variables de entorno

El proyecto usa variables `EXPO_PUBLIC_*` (visibles en el cliente, no son secretas). Edita tu `.env`:

```env
EXPO_PUBLIC_API_URL=https://backend-dental-bosch-vr8o.onrender.com/api
EXPO_PUBLIC_EAS_PROJECT_ID=49cfe676-a695-40fc-9f19-d07c583a5183
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<tu-client-id-web>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<tu-client-id-android>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<tu-client-id-ios>
```

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL base del backend REST | Ya configurada (Render) |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | ID del proyecto en Expo | `app.config.ts` → `extra.eas.projectId`, o `eas project:info` |
| `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` | Client IDs de Google Sign-In (Web/Android/iOS) | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client IDs |

También necesitas el archivo **`google-services.json`** en la raíz del proyecto (Firebase → Project settings → tu app Android → descargar `google-services.json`). Ya está referenciado en `app.config.ts` bajo `android.googleServicesFile`.

---

## Ejecución

### En desarrollo (con development build)

1. Genera o instala tu development build (una sola vez, o cuando cambies dependencias nativas):
   ```bash
   eas build --profile development --platform android
   ```
   Instala el `.apk` generado en tu dispositivo/emulador.

2. Inicia el servidor de Metro:
   ```bash
   npx expo start --dev-client
   ```

3. Escanea el QR con tu development build (no con la app de Expo Go).

### Comandos rápidos

```bash
npm run android   # abre en Android (requiere dev build o emulador configurado)
npm run ios       # abre en iOS (requiere macOS)
npm run web       # abre en navegador (funcionalidad limitada: sin push, sin Google Sign-In nativo)
```

---

## Builds con EAS

| Perfil | Uso | Comando |
|---|---|---|
| `development` | Development client para día a día | `eas build -p android --profile development` |
| `preview` | APK interno para probar con testers | `eas build -p android --profile preview` |
| `production` | Build final para tienda | `eas build -p android --profile production` |

Verifica el estado de tus credenciales nativas en cualquier momento con:
```bash
eas credentials -p android
```

---

## Notificaciones push

La app usa dos mecanismos distintos:

1. **Push notifications** (servidor → doctor): cuando un paciente agenda o cancela una cita, el backend envía un push al doctor vía Expo Push API. Requiere que el token del dispositivo esté registrado (se hace automático al iniciar sesión) **y** que el proyecto tenga configurada la credencial **FCM V1 (Google Service Account Key)** en EAS — sin eso, el push nunca llega aunque todo el código esté bien.

2. **Notificaciones locales** (paciente): al agendar una cita se programa un recordatorio local 1 hora antes, manejado enteramente por el sistema operativo del dispositivo (no depende del backend).

Para verificar que las credenciales FCM V1 están configuradas:
```bash
eas credentials -p android
```
Debe mostrar datos (Project ID, Client Email) bajo **"Push Notifications (FCM V1)"**, no "None assigned yet".

Para probar un push manualmente sin pasar por el backend, usa la herramienta oficial: [expo.dev/notifications](https://expo.dev/notifications), pegando el `ExponentPushToken[...]` que aparece en los logs de Metro tras iniciar sesión.

---

## Estructura del proyecto

```
DentalBosch/
├── app/                      # Rutas (Expo Router, file-based)
│   ├── (auth)/                # Login, registro, recuperar contraseña
│   ├── (tabs)/                 # Navegación principal por tabs
│   ├── (profile)/              # Perfil según rol
│   └── mis-citas/               # Detalle/estado de citas
├── src/
│   ├── entities/               # Modelos y servicios de dominio (citas, user, paciente, historial, auth)
│   ├── features/                # Lógica de features concretas (ej. onboarding)
│   ├── pages/                    # Composición de pantallas completas
│   └── shared/                    # UI compartida, hooks, lib (notificaciones, apiClient, storage)
├── Skills/                    # Documentación técnica interna del proyecto (SKILL.md)
├── supabase/migrations/        # Migraciones SQL de referencia
├── app.config.ts               # Configuración dinámica de Expo
├── eas.json                    # Perfiles de build EAS
└── .env.example                 # Plantilla de variables de entorno
```

Sigue **Feature-Sliced Design**: `entities` no importa de `features`/`pages`, `features` no importa de `pages`, y `shared` no depende de ninguna capa superior.

---

## Roles y cuentas

- **Paciente**: se registra libremente desde la app (`RegisterPage`, rol `paciente` por defecto). Puede agendar/cancelar citas y ver su historial clínico.
- **Doctor**: el rol `doctor` **no es autorregistrable** desde la app — la cuenta se crea directamente en el backend/base de datos. Puede ver las citas agendadas y el historial de sus pacientes.

---

## 🔑 Credenciales de prueba

> Completa aquí tus credenciales de prueba para no tener que buscarlas cada vez. Este archivo no se sube con datos reales sensibles a repos públicos — si tu repo es público, considera mover esta sección a un `.env.local` o a un gestor de contraseñas en su lugar.

### Cuenta de Doctor

| Campo | Valor |
|---|---|
| Email | `andrespanchichavez@gmail.com` |
| Contraseña | `AndresPanchi2003` |


### Cuenta de Paciente

| Campo | Valor |
|---|---|
| Email | `guanoluisaalejandro5@gmail.com` |
| Contraseña | `Alejo2005g#` |

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run start` | Inicia Metro (equivalente a `expo start`) |
| `npm run android` | Abre en Android |
| `npm run ios` | Abre en iOS |
| `npm run web` | Abre en navegador |
| `npm run lint` | Corre ESLint sobre el proyecto |
| `npm run reset-project` | Resetea a la plantilla base de Expo (⚠️ no usar en este proyecto, es del boilerplate original) |

---

## Problemas comunes

**"No me llegan las notificaciones push al doctor"**
→ Revisa `eas credentials -p android`. Si "Push Notifications (FCM V1)" dice "None assigned yet", necesitas subir la Service Account Key de Firebase (Project settings → Service accounts → Generate new private key → `eas credentials` → Google Service Account → Set up FCM V1 key).

**"El recordatorio local del paciente no aparece"**
→ Si la cita agendada está a menos de 60 minutos de distancia, el recordatorio se descarta automáticamente (no tiene sentido programar un aviso "1 hora antes" para una cita que ya está a menos de 1 hora). Revisa los logs de Metro para confirmar.

**"La app crashea al abrir con Expo Go"**
→ Esperado. Esta app requiere un development build por los módulos nativos (notificaciones, date picker). Usa `eas build --profile development`.