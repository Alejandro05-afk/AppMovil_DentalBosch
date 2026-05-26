name: historial-clinico-timeline
description: >
  Úsalo cuando el usuario necesite implementar el servicio de integración API 
  y la interfaz visual (UI) del Historial Clínico en formato de línea de tiempo vertical.
  Aplica para solicitudes como "pantalla de historial clínico", "línea de tiempo de consultas",
  "ver mis consultas pasadas", "detalle de diagnóstico y tratamiento" o "conectar endpoint de historial".
  Genera los modelos en la capa entities, el servicio con Axios, la feature de la línea de tiempo 
  con colapso/expansión de tarjetas y la página contenedora respetando estrictamente FSD.
---

# Skill: Historial Clínico con Línea de Tiempo Vertical — DentalBosch

Este skill guía y genera la implementación completa (Tipos, Servicio API, Componente de Feature y Página) para renderizar el Historial Clínico de un paciente consumiendo el endpoint estructurado de Render/Localhost, transformándolo en una línea de tiempo interactiva.

---

## 1. Arquitectura FSD a Implementar

Toda creación de archivos debe distribuirse exactamente bajo las siguientes capas de `src/`:


```

src/
├── entities/
│   └── historial/
│       ├── api/
│       │   └── historial.service.ts  ← Servicio de fetch (Axios) con Bearer Token
│       └── model/
│           └── historial.types.ts    ← Interfaces completas de la respuesta del backend
├── features/
│   └── historial-timeline/
│       ├── ui/
│       │   ├── TimelineItem.tsx      ← Punto o nodo de la línea de tiempo (Muestra diagnóstico/tratamiento)
│       │   └── TimelineList.tsx      ← Lista vertical/Scroll de consultas
│       └── index.ts                  ← Re-export público de la feature
└── pages/
└── historial/
└── HistorialClinicoPage.tsx  ← Orquesta la carga (LoadingScreen/ErrorScreen) y muestra la línea de tiempo

```

---

## 2. Definición de Tipos de Datos (TypeScript)

**Archivo:** `src/entities/historial/model/historial.types.ts`

```typescript
export interface UsuarioInfo {
  nombre: string;
  apellido: string;
  email?: string;
}

export interface PacienteInfo {
  usuario: UsuarioInfo;
}

export interface DoctorInfo {
  usuario: UsuarioInfo;
  especialidad: string;
}

export interface CitaInfo {
  motivo: string;
  fecha: string;
  estado: string;
}

export interface OdontogramaInfo {
  dientes: any[];
  tipoDenticion: 'permanente' | 'temporal' | string;
}

export interface Consulta {
  _id: string;
  fecha: string;
  motivoConsulta: string;
  diagnostico: {
    descripcion?: string;
    observaciones?: string;
    [key: string]: any;
  };
  tratamiento: {
    procedimiento?: string;
    indicaciones?: string;
    [key: string]: any;
  };
  odontograma?: OdontogramaInfo;
  doctor: DoctorInfo;
  cita: CitaInfo;
}

export interface HistorialClinicoDatos {
  _id: string;
  paciente: PacienteInfo;
  numeroHistoriaClinica: string;
  consultas: Consulta[];
  antecedentes: Record<string, any>;
  informacionComplementaria: {
    grupoEtario: string;
    edad: number;
    nombreCompleto: string;
  };
}

export interface HistorialClinicoResponse {
  success: boolean;
  mensaje: string;
  datos: HistorialClinicoDatos;
}

```

---

## 3. Integración con el Servicio de API

Se utiliza el `apiClient` ya configurado en el proyecto compartiendo interceptores de autenticación para adjuntar de forma transparente el `Authorization: Bearer {{token}}`.

**Archivo:** `src/entities/historial/api/historial.service.ts`

```typescript
import { apiClient } from '@/shared/api/apiClient';
import { HistorialClinicoResponse } from '../model/historial.types';

export const historialService = {
  /**
   * Obtiene el historial clínico completo de un paciente por su ID.
   */
  getHistorialPorPaciente: async (pacienteId: string): Promise<HistorialClinicoResponse> => {
    // Utiliza la URL base configurada o concatena el endpoint absoluto solicitado
    const response = await apiClient.get<HistorialClinicoResponse>(`/historial-clinico/${pacienteId}`);
    return response.data;
  },
};

```

---

## 4. Componente de Feature: Línea de Tiempo Interactiva

Cada nodo de la línea de tiempo representa una consulta médica. Al presionar el componente, este expande una tarjeta detallando el diagnóstico y tratamiento específicos utilizando los colores del sistema (`#FF4FA3` y `#38D6C4`).

**Archivo:** `src/features/historial-timeline/ui/TimelineItem.tsx`

```tsx
import React, { useState } from 'react';
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Consulta } from '@/entities/historial/model/historial.types';

// Habilitar animaciones de diseño en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TimelineItemProps {
  consulta: Consulta;
  isFirst: boolean;
  isLast: boolean;
}

export function TimelineItem({ consulta, isFirst, isLast }: TimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  // Formatear fecha legible
  const fechaLegible = new Date(consulta.fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View className="flex-row px-4">
      
      <View className="items-center mr-4">
        
        <View ${isFirst ''}`} 'opacity-0' : ? bg-gray-200 className="{`w-0.5" flex-1/>
        
        
        <Pressable ${ 'bg-primary 'bg-white : ? border-2 border-primary' border-secondary' className="{`w-5" h-5 isExpanded items-center justify-center onPress="{toggleExpand}" rounded-full z-10 }`}>
          <View ${isExpanded 'bg-secondary'}`} 'bg-white' : ? className="{`w-2" h-2 rounded-full/>
        </Pressable>

        
        <View ${isLast ''}`} 'opacity-0' : ? bg-gray-200 className="{`w-0.5" flex-1/>
      </View>

      
      <View className="flex-1 pb-6">
        <Pressable ${ 'border-gray-100' 'border-primary/40' : ? active:bg-gray-50`} bg-white border className="{`p-4" isExpanded onPress="{toggleExpand}" rounded-xl shadow-soft }>
          
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-xs font-semibold text-secondary uppercase tracking-wider">
              {fechaLegible}
            </Text>
            <Ionicons 'chevron-down'} 'chevron-up' : ? color="#0F172A" name="{isExpanded" size="{18}"/>
          </View>

          <Text className="text-dark font-bold text-base mb-1" numberOfLines="{1}">
            {consulta.motivoConsulta || 'Consulta Odontológica'}
          </Text>
          
          <Text className="text-gray-500 text-xs mb-2">
            Dr. {consulta.doctor.usuario.nombre} {consulta.doctor.usuario.apellido} — {consulta.doctor.especialidad}
          </Text>

          
          {isExpanded && (
            <View className="mt-3 pt-3 border-t border-gray-100 space-y-3">
              
              <View className="bg-light-bg p-3 rounded-lg border-l-4 border-primary">
                <Text className="text-xs font-bold text-primary uppercase mb-1">Diagnóstico</Text>
                <Text className="text-dark text-sm leading-relaxed">
                  {consulta.diagnostico?.descripcion || 'No detallado en la consulta.'}
                </Text>
                {consulta.diagnostico?.observaciones && (
                  <Text className="text-gray-500 text-xs mt-1 italic">
                    Obs: {consulta.diagnostico.observaciones}
                  </Text>
                )}
              </View>

              
              <View className="bg-light-bg p-3 rounded-lg border-l-4 border-secondary">
                <Text className="text-xs font-bold text-secondary uppercase mb-1">Tratamiento Aplicado</Text>
                <Text className="text-dark text-sm leading-relaxed">
                  {consulta.tratamiento?.procedimiento || 'No especificado.'}
                </Text>
                {consulta.tratamiento?.indicaciones && (
                  <Text className="text-gray-500 text-xs mt-1">
                    • {consulta.tratamiento.indicaciones}
                  </Text>
                )}
              </View>

              {/* Información de la cita asociada */}
              {consulta.cita && (
                <View className="flex-row items-center pt-1">
                  <Ionicons className="mr-1" color="#6B7280" name="bookmark-outline" size="{14}"/>
                  <Text className="text-gray-400 text-xs">
                    Vinculado a cita de tipo: {consulta.cita.motivo} ({consulta.cita.estado})
                  </Text>
                </View>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

```

**Archivo:** `src/features/historial-timeline/ui/TimelineList.tsx`

```tsx
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { TimelineItem } from './TimelineItem';
import { Consulta } from '@/entities/historial/model/historial.types';
import { EmptyState } from '@/shared/ui';

interface TimelineListProps {
  consultas: Consulta[];
}

export function TimelineList({ consultas }: TimelineListProps) {
  // Ordenar las consultas cronológicamente de la más reciente a la más antigua
  const consultasOrdenadas = [...consultas].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  if (consultasOrdenadas.length === 0) {
    return (
      <View className="py-12">
        <EmptyState message="Aún no tienes visitas médicas asentadas en tu historial clínico." title="Sin consultas registradas"/>
      </View>
    );
  }

  return (
    <ScrollView 16 className="flex-1 bg-light-bg" contentContainerStyle="{{" paddingVertical: }}>
      {consultasOrdenadas.map((consulta, index) => (
        <TimelineItem - 0} 1} consulta="{consulta}" consultasOrdenadas.length isFirst="{index" isLast="{index" key="{consulta._id}"/>
      ))}
    </ScrollView>
  );
}

```

**Archivo:** `src/features/historial-timeline/index.ts`

```typescript
export { TimelineList } from './ui/TimelineList';
export { TimelineItem } from './ui/TimelineItem';

```

---

## 5. Orquestación en la Capa de Páginas

**Archivo:** `src/pages/historial/HistorialClinicoPage.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StatusBar, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { historialService } from '@/entities/historial/api/historial.service';
import { HistorialClinicoDatos } from '@/entities/historial/model/historial.types';
import { TimelineList } from '@/features/historial-timeline';
import { LoadingScreen, ErrorScreen } from '@/shared/ui';

interface HistorialClinicoPageProps {
  pacienteId: string;
}

export function HistorialClinicoPage({ pacienteId }: HistorialClinicoPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialClinicoDatos null |>(null);

  const cargarHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await historialService.getHistorialPorPaciente(pacienteId);
      if (response.success && response.datos) {
        setHistorial(response.datos);
      } else {
        setError(response.mensaje || 'No se pudo obtener la información.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pacienteId) {
      cargarHistorial();
    }
  }, [pacienteId]);

  if (loading) {
    return <LoadingScreen fullScreen message="Cargando historial clínico..."/>;
  }

  if (error || !historial) {
    return (
      <ErrorScreen 'Historial disponible'} message="{error" no onRetry="{cargarHistorial}" ||/>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-light-bg">
      <StatusBar barStyle="dark-content"/>
      
      
      <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center space-x-3">
          <Pressable onPress="{()"> router.back()} 
            className="p-1 rounded-full active:bg-gray-100 mr-2"
          >
            <Ionicons color="#0F172A" name="arrow-back" size="{24}"/>
          </Pressable>
          <View>
            <Text className="text-dark font-bold text-lg">Historial Clínico</Text>
            <Text className="text-gray-400 text-xs font-medium">
              {historial.numeroHistoriaClinica}
            </Text>
          </View>
        </View>
      </View>

      {/* Resumen del Paciente / Info Complementaria */}
      <View className="bg-white px-5 py-4 mb-2 shadow-sm border-b border-gray-100 flex-row justify-between items-center">
        <View>
          <Text className="text-dark font-bold text-base">
            {historial.informacionComplementaria?.nombreCompleto || 'Paciente'}
          </Text>
          <Text className="text-gray-500 text-xs">
            Edad: {historial.informacionComplementaria?.edad} años ({historial.informacionComplementaria?.grupoEtario})
          </Text>
        </View>
        <View className="bg-secondary/10 px-3 py-1 rounded-full">
          <Text className="text-secondary font-semibold text-xs uppercase">
            {historial.consultas?.length || 0} Consultas
          </Text>
        </View>
      </View>

      
      <View className="flex-1">
        <TimelineList []} consultas="{historial.consultas" ||/>
      </View>
    </SafeAreaView>
  );
}

```

---

## 6. Verificación de Cumplimiento Técnico

1. **FSD Boundaries:** Ningún archivo de la capa `entities` o `features` importa elementos de la capa `pages`.
2. **NativeWind v4:** Estilos declarados mediante atributos `className` integrando colores del token (`bg-primary`, `border-secondary`, `text-dark`, etc.).
3. **Control de Flujos:** Errores de red e interfaces vacías interceptados mediante componentes atómicos reutilizables del core del proyecto (`@shared/ui`).

```

```

```</HistorialClinicoDatos></HistorialClinicoResponse></HistorialClinicoResponse>

```