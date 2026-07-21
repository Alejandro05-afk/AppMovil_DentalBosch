import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { citasService } from '@/entities/citas/api/citas.service';
import { CitaDoctor } from '@/entities/citas/model/citas.types';
import { Card, LoadingScreen, ErrorScreen, colors, spacing } from '@/shared/ui';

const DIAS_CORTO = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const SCREEN_W = Dimensions.get('window').width;
const CELDA_SIZE = Math.floor((SCREEN_W - spacing.lg * 2 - 4) / 7);

function getEstadoInfo(estado: any): { texto: string; color: string } {
  if (typeof estado === 'object' && estado !== null) {
    return { texto: estado.etiqueta || estado.valor, color: estado.color };
  }
  const mapa: Record<string, string> = {
    pendiente: '#f59e0b', confirmada: '#16a34a', finalizada: '#6b7280', cancelada: '#dc2626',
  };
  return { texto: estado, color: mapa[estado] || '#6b7280' };
}

function formatFechaKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

function formatFechaDisplay(f: string): string {
  if (!f) return '';
  const partes = f.split('-');
  if (partes.length !== 3) return f;
  const d = new Date(+partes[0], +partes[1] - 1, +partes[2]);
  return `${d.getDate()} de ${MESES[d.getMonth()]} del ${d.getFullYear()}`;
}

function getNombrePaciente(c: CitaDoctor): string {
  const p = c.paciente;
  if (!p) return 'Paciente';
  const u = p.usuario;
  if (u?.nombre) return `${u.nombre} ${u.apellido || ''}`.trim();
  if (u?.nombreCompleto) return u.nombreCompleto;
  if (p.nombre) return `${p.nombre} ${p.apellido || ''}`.trim();
  if ((p as any).nombreCompleto) return (p as any).nombreCompleto;
  return 'Paciente';
}

export function DoctorCitasPage() {
  const [pageState, setPageState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [pageError, setPageError] = useState('');
  const [citas, setCitas] = useState<CitaDoctor[]>([]);
  const [baseMes, setBaseMes] = useState(() => {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const mesStr = `${MESES[baseMes.getMonth()]} ${baseMes.getFullYear()}`;

  const cargarCitas = useCallback(async () => {
    setPageState('loading');
    setPageError('');
    try {
      const anio = baseMes.getFullYear();
      const mes = baseMes.getMonth();
      const ultimo = new Date(anio, mes + 1, 0).getDate();
      const desde = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
      const hasta = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimo).padStart(2, '0')}`;

      const data = await citasService.obtenerCitasDoctor({ desde, hasta, limit: 100 });
      setCitas(data.citas || []);
      setPageState('ready');
    } catch (e: any) {
      setPageError(e.response?.data?.mensaje || e.message || 'Error al cargar citas');
      setPageState('error');
    }
  }, [baseMes]);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  const citasPorFecha = new Map<string, CitaDoctor[]>();
  for (const c of citas) {
    const key = c.fecha?.split('T')[0] || c.fecha;
    if (!key) continue;
    if (!citasPorFecha.has(key)) citasPorFecha.set(key, []);
    citasPorFecha.get(key)!.push(c);
  }

  const irAlMes = (delta: number) => {
    setBaseMes(new Date(baseMes.getFullYear(), baseMes.getMonth() + delta, 1));
    setSelectedDay(null);
  };

  const diasEnMes = new Date(baseMes.getFullYear(), baseMes.getMonth() + 1, 0).getDate();
  const primerDow = baseMes.getDay();
  const celdas: (number | null)[] = Array(primerDow).fill(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const hoy = formatFechaKey(new Date());

  if (pageState === 'loading') {
    return <LoadingScreen message="Cargando citas..." fullScreen />;
  }

  if (pageState === 'error') {
    return (
      <ErrorScreen
        title="Error"
        message={pageError}
        fullScreen
        onRetry={cargarCitas}
      />
    );
  }

  const citasDelDia = selectedDay ? citasPorFecha.get(selectedDay) || [] : [];

  if (selectedDay) {
    const fechaFormateada = formatFechaDisplay(selectedDay);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setSelectedDay(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{fechaFormateada}</Text>
            <Text style={styles.headerSub}>{citasDelDia.length} cita{citasDelDia.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.dayContent}>
          {citasDelDia.length === 0 ? (
            <View style={styles.dayEmpty}>
              <Ionicons name="calendar-outline" size={48} color={colors.gray[200]} />
              <Text style={styles.dayEmptyText}>Sin citas este día</Text>
            </View>
          ) : (
            citasDelDia.map((c, idx) => {
              const est = getEstadoInfo(c.estado);
              return (
                <Card key={c._id || `cita-${idx}`} variant="elevated" style={styles.citaCard}>
                  <View style={styles.citaTop}>
                    <View style={styles.citaAvatar}>
                      <Ionicons name="person" size={20} color={colors.white} />
                    </View>
                    <View style={styles.citaTopInfo}>
                      <Text style={styles.pacienteName}>{getNombrePaciente(c)}</Text>
                      <View style={[styles.estadoBadge, { backgroundColor: est.color + '18' }]}>
                        <View style={[styles.estadoDot, { backgroundColor: est.color }]} />
                        <Text style={[styles.estadoText, { color: est.color }]}>{est.texto}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.citaDivider} />
                  <View style={styles.citaInfoRow}>
                    <Ionicons name="time-outline" size={16} color={colors.gray[400]} />
                    <Text style={styles.citaInfoText}>{c.horaInicio} - {c.horaFin}</Text>
                  </View>
                  <View style={styles.citaInfoRow}>
                    <Ionicons name="document-text-outline" size={16} color={colors.gray[400]} />
                    <Text style={styles.citaInfoText}>{c.motivo}</Text>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Citas</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.mesNav}>
        <TouchableOpacity onPress={() => irAlMes(-1)} style={styles.mesNavBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.mesLabel}>{mesStr}</Text>
        <TouchableOpacity onPress={() => irAlMes(1)} style={styles.mesNavBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.diasHeader}>
        {DIAS_CORTO.map((d, i) => {
          const esFin = i === 0 || i === 6;
          return (
            <Text key={`dia-${i}`} style={[styles.diaHeaderText, esFin && styles.diaHeaderFin]}>
              {d}
            </Text>
          );
        })}
      </View>

      <ScrollView style={styles.gridScroll}>
        <View style={styles.grid}>
          {celdas.map((dia, i) => {
            if (dia === null) return <View key={`e-${i}`} style={styles.celda} />;

            const fechaKey = `${baseMes.getFullYear()}-${String(baseMes.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const tieneCitas = citasPorFecha.has(fechaKey);
            const esHoy = fechaKey === hoy;
            const cant = tieneCitas ? citasPorFecha.get(fechaKey)!.length : 0;
            const dow = (primerDow + dia - 1) % 7;
            const esFin = dow === 0 || dow === 6;

            return (
              <TouchableOpacity
                key={fechaKey}
                style={[styles.celda, esHoy && styles.celdaHoy, esFin && !esHoy && styles.celdaFin]}
                onPress={() => setSelectedDay(fechaKey)}
                activeOpacity={0.6}
              >
                <Text style={[styles.celdaNum, esHoy && styles.celdaNumHoy, esFin && !esHoy && styles.celdaNumFin]}>
                  {dia}
                </Text>
                {tieneCitas && (
                  <View style={[styles.cantBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.cantBadgeText}>{cant}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.leyenda}>
          <View style={styles.leyendaItem}>
            <View style={[styles.leyendaDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.leyendaText}>Con citas</Text>
          </View>
          <View style={styles.leyendaItem}>
            <View style={[styles.leyendaDot, { backgroundColor: colors.primary, opacity: 0.2 }]} />
            <Text style={styles.leyendaText}>Hoy</Text>
          </View>
        </View>
        <Text style={styles.totalText}>{citas.length} cita{citas.length !== 1 ? 's' : ''} en el mes</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerBtn: {
    padding: spacing.xs,
    width: 44,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.dark,
  },
  headerSub: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  mesNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  mesNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '0A',
  },
  mesLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  diasHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  diaHeaderText: {
    width: CELDA_SIZE,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[400],
    paddingVertical: 4,
  },
  diaHeaderFin: {
    color: colors.gray[300],
  },
  gridScroll: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  celda: {
    width: CELDA_SIZE,
    height: CELDA_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  celdaHoy: {
    backgroundColor: colors.primary + '14',
  },
  celdaFin: {
    opacity: 0.45,
  },
  celdaNum: {
    fontSize: 15,
    color: colors.dark,
    fontWeight: '500',
  },
  celdaNumHoy: {
    fontWeight: '800',
    color: colors.primary,
  },
  celdaNumFin: {
    color: colors.gray[400],
  },
  cantBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cantBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    backgroundColor: colors.white,
  },
  leyenda: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.xs,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leyendaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leyendaText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  totalText: {
    fontSize: 12,
    color: colors.gray[400],
  },
  dayContent: {
    padding: spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
  },
  dayEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: 60,
  },
  dayEmptyText: {
    fontSize: 16,
    color: colors.gray[300],
    fontWeight: '500',
  },
  citaCard: {
    padding: spacing.lg,
  },
  citaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  citaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citaTopInfo: {
    flex: 1,
  },
  pacienteName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 4,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  estadoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  citaDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing.md,
  },
  citaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  citaInfoText: {
    fontSize: 14,
    color: colors.gray[600],
    flex: 1,
  },
});
