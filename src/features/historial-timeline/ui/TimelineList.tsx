import React from 'react';
import { ScrollView, View } from 'react-native';
import { TimelineItem } from './TimelineItem';
import { Consulta } from '@/entities/historial/model/historial.types';
import { EmptyState } from '@/shared/ui';

interface TimelineListProps {
  consultas: Consulta[];
}

export function TimelineList({ consultas }: TimelineListProps) {
  const consultasOrdenadas = [...consultas].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  if (consultasOrdenadas.length === 0) {
    return (
      <View className="py-16">
        <EmptyState
          title="Sin consultas registradas"
          message="Aún no tienes visitas médicas asentadas en tu historial clínico."
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}>
      {consultasOrdenadas.map((consulta, index) => (
        <TimelineItem
          key={consulta._id}
          consulta={consulta}
          index={index}
          isLast={index === consultasOrdenadas.length - 1}
        />
      ))}
    </ScrollView>
  );
}
