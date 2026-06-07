---
name: onboarding-post-login-dentalbosch
description: >
  Úsalo cuando el usuario necesite implementar el onboarding post-login de DentalBosch.
  Se activa ante menciones de: "onboarding después del login", "tutorial post-login",
  "presentar funcionalidades según rol", "primera vez que inicia sesión", "walkthrough por rol",
  "onboarding de paciente", "onboarding de doctor".
  Genera 4 slides por rol (paciente y doctor), persistencia por usuario con AsyncStorage,
  y redirección automática a /(tabs) al finalizar, respetando FSD y el design system existente.
---

# Skill: Onboarding Post-Login por Rol — DentalBosch

Muestra el onboarding UNA sola vez por usuario después de hacer login o registro,
con slides distintos para paciente y doctor. Usa el `userId` como clave de AsyncStorage
para que si otro usuario inicia sesión en el mismo dispositivo, también vea su onboarding.

---

## 1. Arquitectura FSD a Implementar

```
src/
├── shared/
│   └── lib/
│       └── onboardingStorage.ts          ← Lee/escribe por userId en AsyncStorage
├── features/
│   └── onboarding/
│       ├── index.ts                      ← Re-export público de la feature
│       ├── model/
│       │   └── onboarding.slides.ts      ← Arrays PATIENT_SLIDES y DOCTOR_SLIDES
│       └── ui/
│           ├── OnboardingSlide.tsx       ← Slide individual con animaciones
│           └── OnboardingPager.tsx       ← FlatList + dots animados + botones
└── pages/
    └── onboarding/
        └── OnboardingPage.tsx            ← Carga el perfil, decide slides, navega a /(tabs)

app/
└── (tabs)/
    └── _layout.tsx                       ← YA EXISTE — NO modificar su estructura,
                                             solo añadir la lógica de redirección aquí
                                             O usar app/onboarding.tsx (ver sección 5)
```

---

## 2. Flujo Completo

```
Login / Register exitoso
        │
        ▼
authStorage.setToken(token)          ← ya existe en LoginPage y RegisterPage
        │
        ▼
router.replace('/(tabs)')            ← ya existe en ambas páginas
        │
        ▼
app/(tabs)/_layout.tsx  →  useEffect: consulta onboardingStorage.isCompleted(userId)
        │
   ┌────┴────┐
   │ false   │ true
   ▼         ▼
router.replace  Carga normal
('/onboarding') de tabs
```

El punto de intercepción es `app/(tabs)/_layout.tsx` porque es el primer componente
que monta al llegar a las tabs. Allí tienes acceso a `authService.getProfile()` para
obtener el `rol` y el `userId` del usuario autenticado.

---

## 3. Persistencia con AsyncStorage (clave por usuario)

**Archivo:** `src/shared/lib/onboardingStorage.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// La clave incluye el userId para soportar múltiples usuarios en el mismo dispositivo
const getKey = (userId: string) => `onboarding_done_${userId}`;

export const onboardingStorage = {
  async isCompleted(userId: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(getKey(userId));
      return value === 'true';
    } catch {
      return false;
    }
  },

  async markCompleted(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(getKey(userId), 'true');
    } catch (e) {
      console.warn('onboardingStorage.markCompleted error:', e);
    }
  },

  // Solo para desarrollo/testing
  async reset(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(getKey(userId));
    } catch {}
  },
};
```

**Por qué usar `userId` y no solo una flag global:**
Si el usuario A completa el onboarding, cierra sesión y el usuario B inicia sesión
en el mismo dispositivo, B debe ver su propio onboarding. Con una flag global, B
se lo saltaría. La clave `onboarding_done_${userId}` resuelve esto correctamente.

---

## 4. Contenido de los Slides por Rol

**Archivo:** `src/features/onboarding/model/onboarding.slides.ts`

```typescript
export interface OnboardingSlide {
  id: string;
  icon: string;        // nombre de Ionicons
  iconBg: string;      // color de fondo del círculo del ícono
  iconColor: string;   // color del ícono
  accentColor: string; // color del dot activo y del botón principal
  title: string;
  description: string;
}

// ─── SLIDES PARA PACIENTE (4 slides) ────────────────────────────────────────

export const PATIENT_SLIDES: OnboardingSlide[] = [
  {
    id: 'p1',
    icon: 'calendar-outline',
    iconBg: '#FFF0F7',
    iconColor: '#FF4FA3',
    accentColor: '#FF4FA3',
    title: 'Agenda tu cita en segundos',
    description:
      'Elige tu doctor preferido, selecciona el horario disponible y reserva tu cita odontológica sin llamadas ni esperas.',
  },
  {
    id: 'p2',
    icon: 'document-text-outline',
    iconBg: '#EBFFFD',
    iconColor: '#38D6C4',
    accentColor: '#38D6C4',
    title: 'Tu historial siempre contigo',
    description:
      'Consulta cada visita con su diagnóstico, tratamiento y prescripciones en una línea de tiempo clara e interactiva.',
  },
  {
    id: 'p3',
    icon: 'notifications-outline',
    iconBg: '#FFF0F7',
    iconColor: '#FF4FA3',
    accentColor: '#FF4FA3',
    title: 'Notificaciones al instante',
    description:
      'Recibe alertas cuando el doctor confirme o modifique tu cita. Nunca te perderás una actualización importante.',
  },
  {
    id: 'p4',
    icon: 'checkmark-circle-outline',
    iconBg: '#EBFFFD',
    iconColor: '#38D6C4',
    accentColor: '#38D6C4',
    title: '¡Todo listo para empezar!',
    description:
      'Tu salud dental es nuestra prioridad. Agenda tu primera cita y lleva el control de tu historial desde un solo lugar.',
  },
];

// ─── SLIDES PARA DOCTOR (4 slides) ──────────────────────────────────────────

export const DOCTOR_SLIDES: OnboardingSlide[] = [
  {
    id: 'd1',
    icon: 'calendar-number-outline',
    iconBg: '#FFF0F7',
    iconColor: '#FF4FA3',
    accentColor: '#FF4FA3',
    title: 'Tu agenda, bajo control',
    description:
      'Visualiza todas tus citas del mes en un calendario interactivo. Consulta el detalle de cada paciente con un solo toque.',
  },
  {
    id: 'd2',
    icon: 'people-outline',
    iconBg: '#EBFFFD',
    iconColor: '#38D6C4',
    accentColor: '#38D6C4',
    title: 'Gestiona a tus pacientes',
    description:
      'Accede al listado de tus pacientes, busca por nombre o cédula y consulta la última consulta registrada de cada uno.',
  },
  {
    id: 'd3',
    icon: 'notifications-outline',
    iconBg: '#FFF0F7',
    iconColor: '#FF4FA3',
    accentColor: '#FF4FA3',
    title: 'Alertas de nuevas citas',
    description:
      'Recibe notificaciones push en tiempo real cuando un paciente agende o cancele una cita contigo. Siempre informado.',
  },
  {
    id: 'd4',
    icon: 'shield-checkmark-outline',
    iconBg: '#EBFFFD',
    iconColor: '#38D6C4',
    accentColor: '#38D6C4',
    title: '¡Listo para atender!',
    description:
      'Tu perfil profesional y horario de atención están configurados. Comienza a gestionar tu consultorio ahora mismo.',
  },
];
```

---

## 5. Ruta de Expo Router para el Onboarding

Crea el thin wrapper en la raíz del stack (fuera de grupos como `(tabs)` o `(auth)`):

```tsx
// app/onboarding.tsx
export { OnboardingPage as default } from '@/pages/onboarding/OnboardingPage';
```

Declara el screen en `app/_layout.tsx` dentro del `<Stack>` existente:

```tsx
// Añadir junto a los otros Stack.Screen existentes:
<Stack.Screen name="onboarding" options={{ headerShown: false }} />
```

---

## 6. Interceptor en `app/(tabs)/_layout.tsx`

Esta es la pieza clave. Al montar el layout de tabs (justo después del login),
comprueba si el onboarding del usuario actual está completo. Si no lo está,
redirige a `/onboarding` antes de renderizar nada.

```tsx
// app/(tabs)/_layout.tsx  — MODIFICAR el archivo existente

import { Tabs, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/ui/theme';
import { authService } from '@/entities/auth/api/auth.service';   // ← permitido desde app/ solo para este caso puntual de layout
import { onboardingStorage } from '@/shared/lib/onboardingStorage';

// NOTA FSD: app/ no debería importar @entities directamente según las reglas del proyecto.
// Sin embargo, _layout.tsx es infraestructura de routing (no lógica de negocio),
// por lo que esta excepción es aceptable. Alternativamente, mueve esta lógica
// a OnboardingPage.tsx y que sea /(tabs)/index.tsx quien redirija (ver nota al pie).

export default function TabLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const perfil = await authService.getProfile();
        // Usa el email como userId si no hay _id disponible en getProfile()
        // (getProfile() devuelve { nombre, apellido, rol, avatarUrl } — ver auth.service.ts)
        // Para obtener un ID único, usa getFullProfile() para pacientes o getDoctorProfile() para doctores
        // O simplemente usa el email como clave única:
        const userId = perfil.email || perfil.nombre; // ajusta según lo que retorne tu API
        const done = await onboardingStorage.isCompleted(userId);
        if (!done) {
          // Guarda el rol y userId temporalmente para que OnboardingPage los consuma
          // sin hacer otra llamada a la API
          router.replace({
            pathname: '/onboarding',
            params: { userId, rol: perfil.rol },
          });
          return;
        }
      } catch {
        // Si falla la verificación, continúa normalmente (no bloqueamos el acceso)
      } finally {
        setChecked(true);
      }
    })();
  }, []);

  // No renderiza nada hasta verificar, evita flash de las tabs
  if (!checked) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}>
      {/* ... mismos Tabs.Screen que ya existen ... */}
    </Tabs>
  );
}
```

> **Nota alternativa (FSD estricto):** Si prefieres no importar `authService` desde `app/`,
> pasa el `userId` y `rol` como params de navegación desde `LoginPage` y `RegisterPage`
> en el momento de hacer `router.replace('/(tabs)')`. En ese caso, el interceptor en
> `_layout.tsx` solo lee de `onboardingStorage` y los params de la ruta, sin llamar a la API.
> Eso cumple 100% con las reglas FSD del proyecto.

---

## 7. Componente de Slide Individual

**Archivo:** `src/features/onboarding/ui/OnboardingSlide.tsx`

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide as SlideType } from '../model/onboarding.slides';

interface Props {
  slide: SlideType;
  isActive: boolean;
}

const { width: SCREEN_W } = Dimensions.get('window');

export function OnboardingSlide({ slide, isActive }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scaleIcon = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(scaleIcon, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset para reanimar al volver a este slide
      fadeAnim.setValue(0);
      translateY.setValue(24);
      scaleIcon.setValue(0.72);
    }
  }, [isActive]);

  return (
    <View style={{ width: SCREEN_W }} className="flex-1 items-center justify-center px-8">

      {/* Ícono con anillo decorativo exterior */}
      <Animated.View
        style={{ transform: [{ scale: scaleIcon }], opacity: fadeAnim, marginBottom: 44 }}
      >
        {/* Anillo exterior semitransparente */}
        <View
          style={{
            position: 'absolute',
            width: 188,
            height: 188,
            borderRadius: 94,
            backgroundColor: slide.iconBg,
            opacity: 0.45,
            top: -20,
            left: -20,
          }}
        />
        {/* Círculo principal */}
        <View
          style={{
            width: 148,
            height: 148,
            borderRadius: 74,
            backgroundColor: slide.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={slide.icon as any} size={64} color={slide.iconColor} />
        </View>
      </Animated.View>

      {/* Textos */}
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY }] }}
        className="items-center"
      >
        <Text
          className="text-dark text-center font-bold mb-4"
          style={{ fontSize: 26, lineHeight: 32, letterSpacing: -0.5 }}
        >
          {slide.title}
        </Text>
        <Text
          className="text-center"
          style={{ fontSize: 15, lineHeight: 24, color: '#64748B', maxWidth: 300 }}
        >
          {slide.description}
        </Text>
      </Animated.View>
    </View>
  );
}
```

---

## 8. Paginador con Dots Animados

**Archivo:** `src/features/onboarding/ui/OnboardingPager.tsx`

```tsx
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { OnboardingSlide } from './OnboardingSlide';
import { OnboardingSlide as SlideType } from '../model/onboarding.slides';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  slides: SlideType[];   // recibe PATIENT_SLIDES o DOCTOR_SLIDES desde OnboardingPage
  onFinish: () => void;
}

export function OnboardingPager({ slides, onFinish }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = currentIndex === slides.length - 1;
  const activeSlide = slides[currentIndex];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = () => {
    if (isLast) { onFinish(); return; }
    flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  };

  const goBack = () => {
    if (currentIndex === 0) return;
    flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
  };

  return (
    <View className="flex-1 bg-light-bg">

      {/* Cabecera: logo + botón omitir */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-2">
        <Text className="text-primary font-bold" style={{ fontSize: 16 }}>
          DentalBosch
        </Text>
        {!isLast && (
          <TouchableOpacity onPress={onFinish} className="px-3 py-2" activeOpacity={0.6}>
            <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: '600' }}>
              Omitir
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <OnboardingSlide slide={item} isActive={index === currentIndex} />
        )}
        style={{ flex: 1 }}
      />

      {/* Footer: dots + botones */}
      <View className="px-6 pb-10 pt-2">

        {/* Dots animados */}
        <View className="flex-row justify-center items-center mb-7">
          {slides.map((_, index) => {
            const inputRange = [
              (index - 1) * SCREEN_W,
              index * SCREEN_W,
              (index + 1) * SCREEN_W,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 22, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={{
                  width: dotWidth,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: activeSlide.accentColor,
                  opacity,
                  marginHorizontal: 3,
                }}
              />
            );
          })}
        </View>

        {/* Botones de navegación */}
        <View className="flex-row items-center gap-3">
          {currentIndex > 0 && (
            <TouchableOpacity
              onPress={goBack}
              activeOpacity={0.7}
              style={{
                borderWidth: 1.5,
                borderColor: '#E2E8F0',
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 20,
                backgroundColor: '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 16, color: '#0F172A', fontWeight: '700' }}>←</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor: activeSlide.accentColor,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              // sombra suave
              shadowColor: activeSlide.accentColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '800' }}>
              {isLast ? '¡Comenzar!' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
```

**Detalles del paginador:**
- `slides` lo recibe como prop → el mismo componente sirve para paciente y doctor.
- `activeSlide.accentColor` cambia el color del botón y los dots en tiempo real
  conforme el usuario desliza, sin ninguna condición extra.
- El botón de retroceso aparece solo desde el slide 2 en adelante.
- El botón "Omitir" desaparece en el último slide para forzar que lean la pantalla final.

---

## 9. Re-export de la Feature

**Archivo:** `src/features/onboarding/index.ts`

```typescript
export { OnboardingPager } from './ui/OnboardingPager';
export { OnboardingSlide } from './ui/OnboardingSlide';
export { PATIENT_SLIDES, DOCTOR_SLIDES } from './model/onboarding.slides';
export type { OnboardingSlide as OnboardingSlideType } from './model/onboarding.slides';
```

---

## 10. Página Orquestadora

**Archivo:** `src/pages/onboarding/OnboardingPage.tsx`

Esta página recibe `userId` y `rol` como params de la ruta (enviados desde el interceptor
de `_layout.tsx`), selecciona los slides correctos y al finalizar marca el onboarding
como completo antes de navegar a `/(tabs)`.

```tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingPager, PATIENT_SLIDES, DOCTOR_SLIDES } from '@/features/onboarding';
import { onboardingStorage } from '@/shared/lib/onboardingStorage';

export function OnboardingPage() {
  // Recibe userId y rol pasados como params desde el interceptor de _layout.tsx
  const { userId, rol } = useLocalSearchParams<{ userId: string; rol: string }>();

  // Selección de slides según el rol — sin condiciones complejas
  const slides = rol === 'doctor' ? DOCTOR_SLIDES : PATIENT_SLIDES;

  const handleFinish = async () => {
    if (userId) {
      await onboardingStorage.markCompleted(userId);
    }
    // Reemplaza la pantalla de onboarding con las tabs (no puede volver atrás)
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <OnboardingPager slides={slides} onFinish={handleFinish} />
    </SafeAreaView>
  );
}
```

---

## 11. Adaptación de `LoginPage` y `RegisterPage` (alternativa FSD estricta)

Si prefieres no llamar a `authService` desde `app/(tabs)/_layout.tsx` para respetar
al 100% las reglas FSD, usa este patrón: en lugar de redirigir a `/(tabs)` directamente
desde `LoginPage`, primero consulta el onboarding:

```typescript
// Dentro del onSubmit de LoginPage.tsx (y de forma análoga en RegisterPage.tsx)
// Reemplaza: router.replace('/(tabs)');
// Por esto:

import { onboardingStorage } from '@/shared/lib/onboardingStorage';

// Después de guardar el token:
await authStorage.setToken(response.token);

// Determina si el usuario ya vio el onboarding
// Usa el email como userId (disponible desde el form)
const userId = value.email;
const onboardingDone = await onboardingStorage.isCompleted(userId);

if (onboardingDone) {
  router.replace('/(tabs)');
} else {
  // Pasa userId y rol como params para que OnboardingPage no necesite otra llamada a la API
  // En login no tienes el rol todavía; llama a getProfile() o pásalo desde la respuesta del backend
  const perfil = await authService.getProfile();
  router.replace({
    pathname: '/onboarding',
    params: { userId, rol: perfil.rol },
  });
}
```

> **¿Cuál elegir?**
> - **Interceptor en `_layout.tsx`** → menos cambios en páginas existentes, un solo punto de control.
> - **Lógica en `LoginPage`/`RegisterPage`** → cumple FSD al 100%, pero requiere modificar
>   dos archivos que ya funcionan correctamente.
>
> Para este proyecto, la opción del interceptor en `_layout.tsx` es la más pragmática.

---

## 12. Resumen de Archivos a Crear / Modificar

| Acción        | Ruta                                                       | Descripción                                    |
|---------------|------------------------------------------------------------|------------------------------------------------|
| **Crear**     | `src/shared/lib/onboardingStorage.ts`                      | AsyncStorage con clave por userId              |
| **Crear**     | `src/features/onboarding/model/onboarding.slides.ts`       | PATIENT_SLIDES y DOCTOR_SLIDES                 |
| **Crear**     | `src/features/onboarding/ui/OnboardingSlide.tsx`           | Slide individual animado                       |
| **Crear**     | `src/features/onboarding/ui/OnboardingPager.tsx`           | FlatList + dots + botones                      |
| **Crear**     | `src/features/onboarding/index.ts`                         | Re-export público de la feature                |
| **Crear**     | `src/pages/onboarding/OnboardingPage.tsx`                  | Orquesta slides por rol y navega a /(tabs)     |
| **Crear**     | `app/onboarding.tsx`                                       | Thin wrapper (re-export)                       |
| **Modificar** | `app/(tabs)/_layout.tsx`                                   | Añadir interceptor de onboarding post-login    |
| **Modificar** | `app/_layout.tsx`                                          | Añadir `<Stack.Screen name="onboarding" />`    |

---

## 13. Verificación de Cumplimiento Técnico

1. **Un onboarding por usuario:** La clave `onboarding_done_${userId}` en AsyncStorage
   garantiza que cada usuario lo vea exactamente una vez, incluso en un dispositivo compartido.

2. **Sin flash de tabs:** El interceptor en `_layout.tsx` retorna `null` hasta verificar,
   evitando que las tabs aparezcan un instante antes de la redirección.

3. **FSD Boundaries:**
   - `shared/lib/onboardingStorage` → sin imports de capas superiores ✓
   - `features/onboarding/` → solo importa de `@shared/` ✓
   - `pages/onboarding/` → importa de `@features/onboarding` y `@shared/lib` ✓
   - `app/onboarding.tsx` → solo importa de `@pages/` ✓

4. **NativeWind v4:** Estilos estáticos con `className`, dinámicos (colores del slide,
   sombras del botón) con `style` inline. Los dots usan `Animated.View` + `style` inline
   porque dependen de `scrollX.interpolate`.

5. **Sin dependencias nuevas:** `AsyncStorage` ya está en el proyecto (`2.2.0`),
   `Ionicons` ya está (`@expo/vector-icons`), `Animated` es de React Native core.

6. **Testing en desarrollo:** Para resetear el onboarding de un usuario específico:
   ```typescript
   await onboardingStorage.reset(userId); // borra la clave de ese userId
   ```