---
name: profile-and-password-ui
description: >
  Úsalo cuando el usuario necesite implementar la UI del módulo de perfil
  de paciente o la pantalla de cambio de contraseña en el proyecto DentalBosch
  (Expo / React Native + NativeWind + Zod + FSD). Activa este skill ante
  cualquier mención de: "pantalla de perfil", "UI de perfil", "editar perfil",
  "cambiar contraseña", "screen de perfil", "formulario de perfil",
  "datos personales editable", "cambio de contraseña UI" o cuando se pida
  construir la interfaz visual de estas funcionalidades. El skill genera la UI
  lista para conectar a endpoints reales después; NO implementa las llamadas
  a API ni la lógica de estado global.
---

# Skill: UI de Perfil de Paciente y Cambio de Contraseña — DentalBosch

Genera pantallas en React Native + NativeWind listas para ser conectadas a
endpoints. Sigue estrictamente la arquitectura Feature-Sliced Design (FSD)
del proyecto.

---

## 1. Qué genera este skill (y qué NO)

| ✅ Genera | ❌ NO genera |
|---|---|
| Componentes visuales de perfil y edición | Llamadas reales a la API |
| Formulario de cambio de contraseña con validaciones | Stores globales (Zustand, Redux) |
| Schemas Zod alineados con el registro | Integración con authStorage |
| Placeholders tipados para callbacks de guardado | Lógica de autenticación |
| Navegación entre pantallas de perfil | Tests unitarios |

---

## 2. Arquitectura FSD obligatoria

El proyecto usa **Feature-Sliced Design**. Toda creación de archivos debe
respetar esta estructura bajo `src/`:

```
src/
├── entities/
│   └── user/                        ← NUEVA entidad
│       └── model/
│           └── user.types.ts        ← Tipos del perfil (UserProfile, etc.)
├── features/
│   └── profile/                     ← NUEVA feature
│       ├── ui/
│       │   ├── ProfileView.tsx      ← Vista solo lectura
│       │   ├── EditProfileForm.tsx  ← Formulario de edición
│       │   └── ChangePasswordForm.tsx
│       ├── model/
│       │   ├── profileSchema.ts     ← Schema Zod de perfil editable
│       │   └── passwordSchema.ts    ← Schema Zod de cambio de contraseña
│       └── index.ts                 ← Re-exports públicos de la feature
├── pages/
│   └── profile/                     ← NUEVA página
│       ├── ProfilePage.tsx          ← Orquesta ProfileView + navegación
│       └── ChangePasswordPage.tsx   ← Orquesta ChangePasswordForm
├── widgets/
│   └── profile-header/              ← Widget reutilizable (avatar + nombre)
│       └── ProfileHeader.tsx
└── shared/
    ├── lib/
    │   └── formSchemas.ts           ← Ya existe; reusar passwordSchema y birthDateSchema
    └── ui/                          ← Ya existe; reusar Button, Input, Card, DatePicker, etc.
```

> **Regla FSD clave**: `pages` importa de `features` y `widgets`.
> `features` importa de `entities` y `shared`. Nunca al revés.

---

## 3. Campos del registro y política de edición

Los datos provienen del schema de registro del proyecto. Aplicar este criterio:

### 3.1 Campos NO editables (mostrar como texto plano con ícono 🔒)

| Campo | Razón |
|---|---|
| `email` | Cambio requiere flujo de verificación separado |
| `cedula` | Documento legal de identidad, inmutable |

### 3.2 Campos editables por el usuario

**Datos personales:**
| Campo Zod | Label UI | Tipo de input |
|---|---|---|
| `nombre` | Nombre | Text, solo letras |
| `apellido` | Apellido | Text, solo letras |
| `fechaNacimiento` | Fecha de nacimiento | `DatePicker` (shared/ui) |
| `genero` | Género | Select / Picker |
| `telefono` | Teléfono | Numeric |

**Dirección (`direccion.*`):**
| Campo Zod | Label UI | Tipo de input |
|---|---|---|
| `direccion.calle` | Calle | Text |
| `direccion.ciudad` | Ciudad | Text, solo letras |
| `direccion.provincia` | Provincia | Text, solo letras |

**Contacto de emergencia (`contactoEmergencia.*`):**
| Campo Zod | Label UI | Tipo de input |
|---|---|---|
| `contactoEmergencia.nombre` | Nombre del contacto | Text, solo letras |
| `contactoEmergencia.telefono` | Teléfono del contacto | Numeric |
| `contactoEmergencia.parentesco` | Parentesco | Text |

---

## 4. Schema Zod — perfil editable

**Archivo:** `src/features/profile/model/profileSchema.ts`

```typescript
import { z } from 'zod';
import { birthDateSchema } from '@/shared/lib/formSchemas'; // reusar del proyecto

export const editProfileSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre es muy corto')
    .refine((val) => !/\d/.test(val), 'El nombre no puede contener números'),
  apellido: z
    .string()
    .min(2, 'El apellido es muy corto')
    .refine((val) => !/\d/.test(val), 'El apellido no puede contener números'),
  fechaNacimiento: birthDateSchema,
  genero: z.string().min(1, 'Selecciona un género'),
  telefono: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .regex(/^\d+$/, 'Solo números'),
  direccion: z.object({
    calle: z.string().min(1, 'La calle es obligatoria'),
    ciudad: z
      .string()
      .min(1, 'La ciudad es obligatoria')
      .refine((val) => !/\d/.test(val), 'La ciudad no puede contener números'),
    provincia: z
      .string()
      .min(1, 'La provincia es obligatoria')
      .refine((val) => !/\d/.test(val), 'La provincia no puede contener números'),
  }),
  contactoEmergencia: z.object({
    nombre: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .refine((val) => !/\d/.test(val), 'El nombre no puede contener números'),
    telefono: z
      .string()
      .min(1, 'El teléfono es obligatorio')
      .regex(/^\d+$/, 'Solo números'),
    parentesco: z.string().min(1, 'El parentesco es obligatorio'),
  }),
});

export type EditProfileFormData = z.infer<typeof editProfileSchema>;
```

---

## 5. Schema Zod — cambio de contraseña

**Archivo:** `src/features/profile/model/passwordSchema.ts`

```typescript
import { z } from 'zod';
import { passwordSchema } from '@/shared/lib/formSchemas'; // reusar el existente

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Debes confirmar la contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
```

---

## 6. Tipo de entidad usuario

**Archivo:** `src/entities/user/model/user.types.ts`

```typescript
export interface UserProfile {
  nombre: string;
  apellido: string;
  cedula: string;           // solo lectura — no editable
  email: string;            // solo lectura — no editable
  fechaNacimiento: string;  // ISO date: 'YYYY-MM-DD'
  genero: string;
  telefono: string;
  direccion: {
    calle: string;
    ciudad: string;
    provincia: string;
  };
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    parentesco: string;
  };
  avatarUrl?: string;
}
```

---

## 7. Diseño de las pantallas

### 7.1 ProfilePage — vista principal (solo lectura)

```
┌──────────────────────────────┐
│  ←   Mi Perfil               │  header
├──────────────────────────────┤
│       [Avatar]               │
│    Nombre Apellido           │  ProfileHeader widget
│    ✉ email@ejemplo.com 🔒   │
├──────────────────────────────┤
│  Datos personales      [✏️] │  Card
│  Cédula:      ██████ 🔒     │
│  Teléfono:    ██████        │
│  Género:      ██████        │
│  Nacimiento:  ██████        │
├──────────────────────────────┤
│  Dirección             [✏️] │  Card
│  Calle:      ██████         │
│  Ciudad:     ██████         │
│  Provincia:  ██████         │
├──────────────────────────────┤
│  Contacto emergencia   [✏️] │  Card
│  Nombre:     ██████         │
│  Teléfono:   ██████         │
│  Parentesco: ██████         │
├──────────────────────────────┤
│  [ Cambiar contraseña ]      │  Button secundario
└──────────────────────────────┘
```

- El botón ✏️ en cada Card navega a `EditProfileForm` con la sección
  pre-scrolleada, o abre un modal según la decisión del equipo.
- Los campos 🔒 usan un estilo visual diferenciado (fondo gris, texto opaco).

### 7.2 EditProfileForm

- `react-hook-form` + `zodResolver(editProfileSchema)`.
- Agrupa los campos en tres secciones con el componente `Card` de `shared/ui`.
- Usar `Input` y `DatePicker` de `shared/ui` para consistencia.
- Botón "Guardar cambios": deshabilitado hasta que `isValid && isDirty`.
- Mostrar spinner en el botón durante `isSubmitting`.
- **Prop de salida:** `onSave: (data: EditProfileFormData) => Promise<void>`
  — dejar con `TODO: conectar endpoint PUT /profile`.

### 7.3 ChangePasswordForm

- Tres campos: contraseña actual / nueva / confirmar.
- Toggle ojito (mostrar/ocultar) en cada campo.
- Checklist de criterios en tiempo real debajo del campo "Nueva contraseña":
  - ≥ 8 caracteres
  - Al menos 1 mayúscula
  - Al menos 1 minúscula
  - Al menos 1 número
  - Al menos 1 carácter especial (`!@#$%^&*()_+-=[]{}`)
- Botón "Actualizar contraseña": deshabilitado hasta `isValid`.
- Toast de éxito al completar: `"Contraseña actualizada correctamente ✅"`.
- **Prop de salida:** `onSubmit: (data: ChangePasswordFormData) => Promise<void>`
  — dejar con `TODO: conectar endpoint POST /auth/change-password`.

---

## 8. Componentes de shared/ui a reutilizar

No crear nuevos componentes si ya existen en `shared/ui`:

| Necesidad | Componente existente |
|---|---|
| Campos de texto | `Input` |
| Botones | `Button` |
| Tarjetas de sección | `Card` |
| Selector de fecha | `DatePicker` |
| Pantalla de carga | `LoadingScreen` |
| Pantalla de error | `ErrorScreen` |
| Colores y tipografía | `theme.ts` |

---

## 9. Datos mock para desarrollo

Mientras el endpoint no esté listo, usar datos hardcodeados en `ProfilePage`:

```typescript
// TODO: reemplazar con llamada real a GET /profile
const mockProfile: UserProfile = {
  nombre: 'Ana',
  apellido: 'García',
  cedula: '1234567890',
  email: 'ana.garcia@email.com',
  fechaNacimiento: '1990-05-15',
  genero: 'Femenino',
  telefono: '0987654321',
  direccion: {
    calle: 'Av. Amazonas N23-45',
    ciudad: 'Quito',
    provincia: 'Pichincha',
  },
  contactoEmergencia: {
    nombre: 'Carlos García',
    telefono: '0991234567',
    parentesco: 'Hermano',
  },
};
```

---

## 10. Rutas Expo Router

Agregar grupo de rutas en `app/`:

```
app/
└── (profile)/
    ├── _layout.tsx          ← Stack.Navigator
    ├── index.tsx            ← import { ProfilePage } from '@/pages/profile/ProfilePage'
    └── change-password.tsx  ← import { ChangePasswordPage } from '@/pages/profile/ChangePasswordPage'
```

Navegación desde `ProfilePage`:
```typescript
import { router } from 'expo-router';
router.push('/(profile)/change-password');
```

---

## 11. Checklist de entrega

- [ ] `src/entities/user/model/user.types.ts` — tipo `UserProfile`
- [ ] `src/features/profile/model/profileSchema.ts` — `editProfileSchema`
- [ ] `src/features/profile/model/passwordSchema.ts` — `changePasswordSchema`
- [ ] `src/features/profile/ui/ProfileView.tsx` — vista solo lectura
- [ ] `src/features/profile/ui/EditProfileForm.tsx` — formulario de edición
- [ ] `src/features/profile/ui/ChangePasswordForm.tsx` — cambio de contraseña con checklist
- [ ] `src/features/profile/index.ts` — re-exports públicos
- [ ] `src/widgets/profile-header/ProfileHeader.tsx` — avatar + nombre + email bloqueado
- [ ] `src/pages/profile/ProfilePage.tsx` — orquestador con datos mock
- [ ] `src/pages/profile/ChangePasswordPage.tsx` — orquestador
- [ ] `app/(profile)/_layout.tsx` y rutas configuradas
- [ ] `email` y `cedula` visualmente bloqueados (🔒) en toda la UI
- [ ] Props `onSave` y `onSubmit` tipadas con `TODO: conectar endpoint`
- [ ] Solo se usan componentes de `shared/ui` existentes (sin duplicar)
- [ ] Schemas Zod reutilizan `birthDateSchema` y `passwordSchema` de `shared/lib/formSchemas.ts`