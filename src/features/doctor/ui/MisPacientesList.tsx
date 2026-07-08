import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, Card, Input, LoadingScreen, EmptyState } from '@/shared/ui';
import { pacienteService } from '@/entities/paciente/api/paciente.service';
import { PacienteDoctor } from '@/entities/paciente/model/paciente.types';

function val<T>(obj: any, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj?.[k]) return obj[k];
  }
  return undefined;
}

function nombreCompleto(p: { usuario?: any; nombre?: string; apellido?: string }): string {
  const n = val<string>(p, 'usuario.nombre', 'nombre') || '';
  const a = val<string>(p, 'usuario.apellido', 'apellido') || '';
  return `${n} ${a}`.trim() || 'Sin nombre';
}

function cedulaPaciente(p: { usuario?: any; cedula?: string }): string | undefined {
  return val<string>(p, 'usuario.cedula', 'cedula');
}

function telefonoPaciente(p: { usuario?: any; telefono?: string }): string | undefined {
  return val<string>(p, 'usuario.telefono', 'telefono');
}

const LABELS: Record<string, string> = {
  sesion: 'Sesión',
  fecha: 'Fecha',
  diagnosticosComplicaciones: 'Diagnósticos / Complicaciones',
  procedimientos: 'Procedimientos realizados',
  prescripciones: 'Prescripciones',
  firmaDoctor: 'Doctor',
};

function renderTexto(v: any): React.ReactNode {
  if (!v) return null;
  if (typeof v === 'string') return <Text style={styles.consultaText}>{v}</Text>;
  if (typeof v === 'number' || typeof v === 'boolean') return <Text style={styles.consultaText}>{String(v)}</Text>;
  return null;
}

function valorToString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val === 'undefined' ? '' : val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    const u = val.usuario || {};
    const nom = val.nombreCompleto || u.nombre || val.nombre || val.nombreDoctor || val.label || val.descripcion || '';
    const ape = u.apellido || val.apellido || '';
    return [nom, ape].filter(Boolean).join(' ') || JSON.stringify(val);
  }
  return String(val);
}

function renderDetalleObjeto(obj: Record<string, any>): React.ReactNode {
  if (!obj || typeof obj !== 'object') return null;
  const ignore = new Set(['_id', 'codigo']);
  return Object.entries(obj)
    .filter(([k]) => !ignore.has(k))
    .map(([key, val]) => {
      if (!val) return null;
      const label = LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
      return (
        <View key={key} style={styles.detalleRow}>
          <Text style={styles.detalleLabel}>{label}</Text>
          <Text style={styles.detalleValue}>
            {key === 'fecha' ? String(val).split('T')[0] : valorToString(val)}
          </Text>
        </View>
      );
    });
}

function renderTratamientos(items: any[]): React.ReactNode {
  return items.map((item: any, i: number) => {
    if (!item) return null;
    if (typeof item === 'string') return <Text key={i} style={styles.consultaText}>• {item}</Text>;
    if (typeof item !== 'object') return <Text key={i} style={styles.consultaText}>• {String(item)}</Text>;
    return (
      <View key={i} style={styles.tratamientoCard}>
        <Text style={styles.tratamientoTitle}>
          Tratamiento {item.sesion ? `#${item.sesion}` : i + 1}
        </Text>
        {renderDetalleObjeto(item)}
      </View>
    );
  });
}

export function MisPacientesList() {
  const [pacientes, setPacientes] = useState<PacienteDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<PacienteDoctor[]>([]);
  const [searchError, setSearchError] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [pacienteNombre, setPacienteNombre] = useState('');
  const [ultimaConsulta, setUltimaConsulta] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [historialError, setHistorialError] = useState('');

  const [emergenciaMap, setEmergenciaMap] = useState<Record<string, { nombre?: string; telefono?: string }>>({});

  const fetchPacientes = useCallback(async () => {
    try {
      const data = await pacienteService.obtenerMisPacientes();
      setPacientes(data);
      const map: Record<string, any> = {};
      await Promise.allSettled(data.map(async (p: any) => {
        try {
          const detalle = await pacienteService.obtenerDetallePaciente(p._id);
          if (detalle?.contactoEmergencia?.nombre || detalle?.contactoEmergencia?.telefono) {
            map[p._id] = detalle.contactoEmergencia;
          }
        } catch {}
      }));
      setEmergenciaMap(map);
      setError('');
    } catch (e: any) {
      const msg = e.response?.data?.mensaje || e.response?.data?.error || e.message || 'Error al cargar pacientes';
      setError(msg);
      setPacientes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPacientes();
    }, [fetchPacientes])
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      const term = text.trim().toLowerCase();
      const found = pacientes.filter((p) => {
        const ced = cedulaPaciente(p)?.toLowerCase() || '';
        const name = nombreCompleto(p).toLowerCase();
        return ced.includes(term) || name.includes(term);
      });

      if (found.length > 0) {
        setSearchResults(found);
        setSearchError('');
      } else {
        setSearchResults([]);
        setSearchError('No se encontró paciente');
      }
    }, 300);
  }, [pacientes]);

  const handlePacientePress = useCallback(async (paciente: PacienteDoctor) => {
    setModalVisible(true);
    setModalLoading(true);
    setHistorialError('');
    setPacienteNombre(nombreCompleto(paciente));
    try {
      const historial = await pacienteService.obtenerHistorialClinico(paciente._id);
      const consultas = historial.consultas;
      if (consultas && consultas.length > 0) {
        const ultima = consultas[consultas.length - 1];
        setUltimaConsulta(ultima);
      } else {
        setUltimaConsulta(null);
      }
    } catch (e: any) {
      setUltimaConsulta(null);
      if (e.response?.status === 404) {
        setHistorialError('');
      } else {
        const msg = e.response?.data?.mensaje || e.response?.data?.error || e.message || 'Error al cargar el historial clínico';
        setHistorialError(msg);
      }
    } finally {
      setModalLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchText('');
    setSearchResults([]);
    setSearchError('');
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  }, []);

  const renderPacienteCard = (paciente: PacienteDoctor, onPress: () => void) => (
    <TouchableOpacity key={paciente._id} onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" style={styles.pacienteCard}>
        <View style={styles.pacienteRow}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.pacienteInfo}>
            <Text style={styles.pacienteName}>{nombreCompleto(paciente)}</Text>
            {cedulaPaciente(paciente) ? (
              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={14} color={colors.gray[400]} />
                <Text style={styles.infoText}>{cedulaPaciente(paciente)}</Text>
              </View>
            ) : null}
            {telefonoPaciente(paciente) ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={14} color={colors.gray[400]} />
                <Text style={styles.infoText}>{telefonoPaciente(paciente)}</Text>
              </View>
            ) : null}
            {(() => {
              const ec = emergenciaMap[paciente._id];
              if (!ec?.nombre && !ec?.telefono) return null;
              return (
                <View style={styles.infoRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
                  <Text style={[styles.infoText, { color: colors.danger }]} numberOfLines={1}>
                    {ec.nombre || ''}{ec.nombre && ec.telefono ? ' · ' : ''}{ec.telefono || ''}
                  </Text>
                </View>
              );
            })()}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[300]} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const hasSearchText = searchText.trim().length > 0;

  if (isLoading) return <LoadingScreen message="Cargando pacientes..." />;

  return (
    <>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Buscar por nombre"
          value={searchText}
          onChangeText={handleSearchChange}
          leftIcon="search-outline"
          rightIcon={hasSearchText ? 'close-circle-outline' : undefined}
          onRightIconPress={clearSearch}
        />
      </View>

      {hasSearchText && searchResults.length > 0
        ? searchResults.map((p) => renderPacienteCard(p, () => handlePacientePress(p)))
        : null}

      {hasSearchText && searchResults.length === 0 && searchError ? (
        <Card variant="outline" style={styles.searchResultCard}>
          <View style={styles.searchResultContent}>
            <Ionicons name="search-outline" size={32} color={colors.gray[300]} />
            <Text style={styles.searchErrorText}>{searchError}</Text>
            <TouchableOpacity onPress={clearSearch}>
              <Text style={styles.clearSearchLink}>Limpiar búsqueda</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : null}

      {!hasSearchText ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Pacientes</Text>
            <Text style={styles.sectionCount}>{pacientes.length}</Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#dc2626" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : pacientes.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="Sin pacientes"
              message="No tienes pacientes registrados aún."
            />
          ) : (
            pacientes.map((p) => renderPacienteCard(p, () => handlePacientePress(p)))
          )}
        </>
      ) : null}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Última Consulta</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>

            {modalLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.modalLoader} />
            ) : historialError ? (
              <Text style={styles.modalError}>{historialError}</Text>
            ) : (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalAvatar}>
                  <Ionicons name="person-circle-outline" size={64} color={colors.primary} />
                </View>
                <Text style={styles.modalName}>{pacienteNombre}</Text>

                {ultimaConsulta ? (
                  <>
                    <View style={styles.consultaCard}>
                      <View style={styles.consultaDateRow}>
                        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                        <Text style={styles.consultaDate}>
                          {ultimaConsulta.fecha?.split('T')[0] || ultimaConsulta.fecha}
                        </Text>
                      </View>

                      {(() => {
                        const motivoTexto = ultimaConsulta.motivoConsulta || ultimaConsulta.motivo || ultimaConsulta.cita?.motivo || '';
                        if (!motivoTexto) return null;
                        return (
                          <View style={styles.consultaBlock}>
                            <Text style={styles.consultaLabel}>Motivo de consulta</Text>
                            {renderTexto(motivoTexto)}
                          </View>
                        );
                      })()}

                      {(() => {
                        const obs = ultimaConsulta.observaciones;
                        if (!obs) return null;
                        return (
                          <View style={styles.consultaBlock}>
                            <Text style={styles.consultaLabel}>Observaciones</Text>
                            {typeof obs === 'string'
                              ? renderTexto(obs)
                              : Array.isArray(obs)
                                ? renderTratamientos(obs)
                                : renderDetalleObjeto(obs)}
                          </View>
                        );
                      })()}

                      {(() => {
                        const c = ultimaConsulta;
                        const t = c.tratamientos;
                        const arr = Array.isArray(t) ? t : (t ? [t] : []);
                        const ultimo = arr[arr.length - 1];
                        const proc = Array.isArray(ultimo?.procedimientos) ? ultimo.procedimientos : (ultimo?.procedimiento ? [ultimo.procedimiento] : []);
                        const diag = ultimo?.diagnosticosComplicaciones || ultimo?.diagnostico || c.enfermedadActual?.descripcion || '';
                        const presc = Array.isArray(ultimo?.prescripciones) ? ultimo.prescripciones : (ultimo?.prescripcion ? [ultimo.prescripcion] : []);
                        const indic = ultimo?.indicaciones || '';
                        const recom = c.planDiagnostico?.observaciones || c.planDiagnostico?.otros || '';
                        const tieneContenido = proc.length > 0 || diag || presc.length > 0 || indic || recom;
                        if (!tieneContenido) return null;
                        return (
                          <View style={styles.consultaBlock}>
                            <Text style={styles.consultaLabel}>Tratamientos</Text>
                            {diag ? (
                              <View style={{ backgroundColor: '#FFF1F2', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#FF4FA3', marginBottom: 8 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FF4FA3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Diagnóstico</Text>
                                <Text style={{ fontSize: 14, color: '#0F172A', lineHeight: 20 }}>{diag}</Text>
                              </View>
                            ) : null}
                            {proc.length > 0 ? (
                              <View style={{ backgroundColor: '#F0FDFA', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#38D6C4', marginBottom: 8 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#38D6C4', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Procedimientos</Text>
                                {proc.map((p: string, i: number) => (
                                  <Text key={i} style={{ fontSize: 14, color: '#0F172A', lineHeight: 20 }}>• {p}</Text>
                                ))}
                              </View>
                            ) : null}
                            {presc.length > 0 ? (
                              <View style={{ backgroundColor: '#F5F3FF', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#8B5CF6', marginBottom: 8 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Prescripciones</Text>
                                {presc.map((p: string, i: number) => (
                                  <Text key={i} style={{ fontSize: 14, color: '#0F172A', lineHeight: 20 }}>• {p}</Text>
                                ))}
                              </View>
                            ) : null}
                            {indic ? (
                              <View style={{ backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#F59E0B' }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Indicaciones</Text>
                                <Text style={{ fontSize: 14, color: '#0F172A', lineHeight: 20 }}>{indic}</Text>
                              </View>
                            ) : null}
                            {recom ? (
                              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#94A3B8' }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Recomendaciones</Text>
                                <Text style={{ fontSize: 14, color: '#0F172A', lineHeight: 20 }}>{recom}</Text>
                              </View>
                            ) : null}
                          </View>
                        );
                      })()}
                    </View>
                  </>
                ) : (
                  <EmptyState
                    icon="document-text-outline"
                    title="Sin consultas"
                    message="Este paciente no tiene consultas registradas aún."
                  />
                )}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    marginBottom: spacing.sm,
  },
  searchSpinner: {
    marginVertical: spacing.lg,
  },
  searchResultCard: {
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  searchResultContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchErrorText: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
  },
  clearSearchLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pacienteCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  pacienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pacienteInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  pacienteName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fef2f2',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxHeight: '85%',
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  modalLoader: {
    paddingVertical: spacing['3xl'],
  },
  modalAvatar: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalBody: {
    gap: spacing.xs,
  },
  consultaCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.md,
  },
  consultaDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  consultaDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  consultaBlock: {
    gap: spacing.xs,
  },
  consultaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  consultaText: {
    fontSize: 15,
    color: colors.dark,
    lineHeight: 22,
  },
  detalleRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  detalleLabel: {
    width: 120,
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '500',
  },
  detalleValue: {
    flex: 1,
    fontSize: 14,
    color: colors.dark,
  },
  tratamientoCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tratamientoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  modalError: {
    textAlign: 'center',
    color: colors.danger,
    paddingVertical: spacing.xl,
    fontSize: 15,
  },
});
