import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Button,
    Card,
    H2,
    Paragraph,
    ScrollView,
    Text,
    XStack,
    YStack,
} from 'tamagui';

import { authService } from '@/entities/auth/api/auth.service';
import { UserProfile } from '@/entities/auth/model/auth.types';
import { citasService } from '@/entities/citas/api/citas.service';
import { CitaPaciente } from '@/entities/citas/model/citas.types';
import { MisPacientesList } from '@/features/doctor';
import { useAuth } from '@/shared/contexts/AuthContext';
import { colors, LoadingScreen } from '@/shared/ui';

function getEstadoInfo(estado: string | any): { texto: string; color: string } {
  if (typeof estado === 'object' && estado !== null) {
    return { texto: estado.etiqueta || estado.valor, color: estado.color };
  }
  const mapa: Record<string, string> = {
    pendiente: '#f59e0b',
    confirmada: '#16a34a',
    finalizada: '#6b7280',
    cancelada: '#dc2626',
  };
  return { texto: estado, color: mapa[estado] || '#6b7280' };
}

export function DashboardPage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [citas, setCitas] = useState<CitaPaciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const perfil = await authService.getProfile();
      setProfile(perfil);
    } catch {
      // si falla el perfil, no bloqueamos
    }

    try {
      const citasData = await citasService.obtenerMisCitas({ limit: 50 });
      const lista = citasData.citas || [];
      setCitas(lista);
    } catch {
      setCitas([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await logout();
  };

  const stats = useMemo(() => {
    const pendientes = citas.filter((cita) => getEstadoInfo(cita.estado).texto?.toLowerCase().includes('pend')).length;
    const finalizadas = citas.filter((cita) => getEstadoInfo(cita.estado).texto?.toLowerCase().includes('finaliz')).length;
    return [
      { label: 'Citas', value: String(citas.length), color: '#FF4FA3' },
      { label: 'Pendientes', value: String(pendientes), color: '#F59E0B' },
      { label: 'Finalizadas', value: String(finalizadas), color: '#6B7280' },
    ];
  }, [citas]);

  if (isLoading) {
    return <LoadingScreen message="Cargando..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <YStack padding="$5" paddingBottom="$8" gap="$5">
          <XStack alignItems="center" justifyContent="space-between" gap="$3">
            <YStack flex={1}>
              <Text color="#64748B" fontSize={14} fontWeight="700">
                Bienvenido de vuelta
              </Text>
              <Text color="#0F172A" fontSize={24} fontWeight="900" numberOfLines={1}>
                {profile?.nombre} {profile?.apellido}
              </Text>
            </YStack>
            <Button
              circular
              size="$4"
              backgroundColor="#FFFFFF"
              borderColor="#E2E8F0"
              borderWidth={1}
              icon={<Ionicons name="log-out-outline" size={22} color="#64748B" />}
              onPress={handleLogout}
              pressStyle={{ opacity: 0.8, scale: 0.96 }}
            />
          </XStack>

          <Card
            elevate
            bordered
            backgroundColor="#FFFFFF"
            borderColor="#E2E8F0"
            borderRadius={24}
            overflow="hidden"
            padding="$5"
            gap="$4"
          >
            <XStack alignItems="center" gap="$4" flexWrap="wrap">
              <YStack width={130} height={120} alignItems="center" justifyContent="center">
                <LottieView
                  source={require('../../../assets/lottie/dental-pulse.json')}
                  autoPlay
                  loop
                  style={{ width: 160, height: 120 }}
                />
              </YStack>
              <YStack flex={1} minWidth={170} gap="$2">
                <Text color="#FF4FA3" fontSize={12} fontWeight="900">
                  DENTALBOSCH
                </Text>
                <H2 color="#0F172A" fontSize={27} lineHeight={31}>
                  Tu agenda clinica, lista para hoy
                </H2>
                <Paragraph color="#64748B" fontSize={14} lineHeight={20}>
                  Revisa tus citas, confirma horarios y mantén tu consultorio al día.
                </Paragraph>
              </YStack>
            </XStack>

            {profile?.rol === 'paciente' ? (
              <Button
                backgroundColor="#FF4FA3"
                color="#FFFFFF"
                borderRadius={14}
                fontWeight="900"
                iconAfter={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
                onPress={() => router.push('/(tabs)/agendar')}
                pressStyle={{ opacity: 0.88, scale: 0.98 }}
              >
                Agendar nueva cita
              </Button>
            ) : null}
          </Card>

          {profile?.rol === 'paciente' && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/historial')}
            >
              <Card
                backgroundColor="#FFFFFF"
                borderColor="#E2E8F0"
                borderRadius={20}
                borderWidth={1}
                padding="$4"
              >
                <XStack alignItems="center" gap="$3">
                  <YStack
                    width={48}
                    height={48}
                    borderRadius={14}
                    backgroundColor="#FFF0F7"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Ionicons name="document-text-outline" size={24} color="#FF4FA3" />
                  </YStack>
                  <YStack flex={1} gap="$1">
                    <Text color="#0F172A" fontSize={16} fontWeight="800">
                      Mi Historial Clínico
                    </Text>
                    <Text color="#64748B" fontSize={13}>
                      Revisa tus consultas anteriores
                    </Text>
                  </YStack>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </XStack>
              </Card>
            </TouchableOpacity>
          )}

          {profile?.rol === 'paciente' ? (
            <XStack gap="$3" flexWrap="wrap">
              {stats.map((item) => {
                const routeMap: Record<string, string> = {
                  Citas: '/mis-citas/todas',
                  Pendientes: '/mis-citas/pendientes',
                  Finalizadas: '/mis-citas/finalizadas',
                };
                return (
                  <TouchableOpacity
                    key={item.label}
                    activeOpacity={0.7}
                    onPress={() => router.push(routeMap[item.label] as any)}
                    style={{ flex: 1, minWidth: 98 }}
                  >
                    <Card
                      backgroundColor="#FFFFFF"
                      borderColor="#E2E8F0"
                      borderRadius={18}
                      borderWidth={1}
                      padding="$4"
                      gap="$1"
                    >
                      <Text color={item.color} fontSize={25} fontWeight="900">
                        {item.value}
                      </Text>
                      <Text color="#64748B" fontSize={12} fontWeight="800">
                        {item.label}
                      </Text>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </XStack>
          ) : null}

          {profile?.rol === 'doctor' ? (
            <Card
              backgroundColor="#FFFFFF"
              borderColor="#E2E8F0"
              borderRadius={20}
              borderWidth={1}
              padding="$4"
              gap="$3"
            >
              <Text color="#0F172A" fontSize={19} fontWeight="900">
                Mis pacientes
              </Text>
              <MisPacientesList />
            </Card>
          ) : null}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
