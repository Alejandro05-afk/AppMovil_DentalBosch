import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Consulta } from '@/entities/historial/model/historial.types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TimelineItemProps {
  consulta: Consulta;
  index: number;
  isLast: boolean;
}

function formatFecha(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { dia: '--', mes: '---', anio: '----' };
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return { dia: `${d.getDate()}`, mes: meses[d.getMonth()] || '---', anio: `${d.getFullYear()}` };
  } catch {
    return { dia: '--', mes: '---', anio: '----' };
  }
}

function mostrarArr(arr: any[] | undefined | null, campo: string): string {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '';
  const items = arr.map((item) => {
    if (typeof item === 'string') return item;
    const val = item?.[campo];
    if (val && typeof val === 'string') return val;
    try { return JSON.stringify(item); } catch { return String(item); }
  });
  return items.filter(Boolean).join(' | ');
}

export function TimelineItem({ consulta, index, isLast }: TimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggle = () => {
    setIsExpanded((prev) => !prev);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const f = formatFecha(consulta.fecha);
  const num = index + 1;
  const strNum = num < 10 ? `0${num}` : `${num}`;

  const motivo = consulta.motivoConsulta || '(Sin motivo)';

  // diagnosticos is an array of { descripcion, observaciones, ... }
  const diagDesc = mostrarArr(consulta.diagnosticos, 'descripcion') || mostrarArr(consulta.diagnosticos, 'observaciones') || '(Sin diagnóstico)';

  // tratamientos is an array of { procedimiento, indicaciones, ... }
  const trataDesc = mostrarArr(consulta.tratamientos, 'procedimiento') || mostrarArr(consulta.tratamientos, 'indicaciones') || '(Sin tratamiento)';

  const diagObs = consulta.diagnosticos?.map((d: any) => d.observaciones).filter(Boolean).join(' | ') || '';
  const trataIndic = consulta.tratamientos?.map((t: any) => t.indicaciones).filter(Boolean).join(' | ') || '';

  const drNombre = consulta.doctor?.usuario?.nombre || consulta.doctor?.nombre || '';
  const drApellido = consulta.doctor?.usuario?.apellido || consulta.doctor?.apellido || '';
  const especialidad = consulta.doctor?.especialidad || '';

  const citaMotivo = consulta.cita?.motivo || '';
  const citaEstado = consulta.cita?.estado || '';

  return (
    <View className="flex-row">
      {/* Timeline column */}
      <View className="items-center w-14">
        <View className="flex-1 w-0.5 bg-gray-200" />
        <View className={`w-10 h-10 rounded-2xl items-center justify-center z-10 shadow-sm border-2
          ${isExpanded ? 'bg-primary border-primary' : 'bg-white border-gray-300'}
        `}>
          <Text className={`text-sm font-extrabold ${isExpanded ? 'text-white' : 'text-dark'}`}>
            {strNum}
          </Text>
        </View>
        {!isLast && <View className="flex-1 w-0.5 bg-gray-200" />}
        {isLast && <View className="flex-1 w-0.5 opacity-0" />}
      </View>

      {/* Card column */}
      <View className="flex-1 pr-4 pb-6">
        <TouchableOpacity onPress={toggle} activeOpacity={0.85}>
          <View className={`bg-white rounded-2xl shadow-soft border overflow-hidden
            ${isExpanded ? 'border-primary/30' : 'border-gray-100'}
          `}>
            <View className={`h-1.5 ${isExpanded ? 'bg-primary' : 'bg-gray-100'}`} />

            <View className="px-4 pt-3 pb-4">
              {/* Header row */}
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-2">
                  <View className="w-9 h-9 rounded-xl bg-secondary/10 items-center justify-center">
                    <Ionicons name="calendar-outline" size={16} color="#38D6C4" />
                  </View>
                  <View>
                    <Text className="text-dark font-bold text-base leading-5">{f.dia} {f.mes}</Text>
                    <Text className="text-gray-400 text-xs">{f.anio}</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-gray-400 text-xs font-medium">Detalle</Text>
                  <View className={`w-6 h-6 rounded-full items-center justify-center
                    ${isExpanded ? 'bg-primary/10' : 'bg-gray-100'}
                  `}>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={isExpanded ? '#FF4FA3' : '#9CA3AF'}
                    />
                  </View>
                </View>
              </View>

              {/* Motivo */}
              <View className="flex-row items-start gap-2 mb-1">
                <View className="mt-0.5">
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6B7280" />
                </View>
                <Text className="text-dark text-sm leading-5 flex-1" numberOfLines={isExpanded ? 0 : 2}>
                  {motivo}
                </Text>
              </View>

              {/* Doctor */}
              {drNombre ? (
                <View className="flex-row items-center gap-2 mt-2">
                  <Ionicons name="medkit-outline" size={13} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs">
                    Dr. {drNombre} {drApellido}{especialidad ? ` — ${especialidad}` : ''}
                  </Text>
                </View>
              ) : null}

              {/* Expandable detail */}
              {isExpanded && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                  {/* Diagnóstico */}
                  <View className="bg-rose-50/70 rounded-xl p-3.5 border-l-[3px] border-primary mb-3">
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className="w-6 h-6 rounded-lg bg-primary/15 items-center justify-center">
                        <Ionicons name="search-outline" size={13} color="#FF4FA3" />
                      </View>
                      <Text className="text-xs font-extrabold text-primary tracking-wider uppercase">
                        Diagnóstico
                      </Text>
                    </View>
                    <Text className="text-dark text-sm leading-5">{diagDesc}</Text>
                    {diagObs ? (
                      <Text className="text-gray-500 text-xs italic mt-2 leading-4">{diagObs}</Text>
                    ) : null}
                  </View>

                  {/* Tratamiento */}
                  <View className="bg-teal-50/70 rounded-xl p-3.5 border-l-[3px] border-secondary mb-3">
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className="w-6 h-6 rounded-lg bg-secondary/15 items-center justify-center">
                        <Ionicons name="bandage-outline" size={13} color="#38D6C4" />
                      </View>
                      <Text className="text-xs font-extrabold text-secondary tracking-wider uppercase">
                        Tratamiento
                      </Text>
                    </View>
                    <Text className="text-dark text-sm leading-5">{trataDesc}</Text>
                    {trataIndic ? (
                      <Text className="text-gray-500 text-xs mt-2 leading-4">• {trataIndic}</Text>
                    ) : null}
                  </View>

                  {/* Cita info */}
                  {citaMotivo ? (
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="bookmark-outline" size={13} color="#D1D5DB" />
                      <Text className="text-gray-400 text-xs">
                        Cita: {citaMotivo}{citaEstado ? ` · ${citaEstado}` : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
