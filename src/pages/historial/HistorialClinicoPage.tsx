import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StatusBar, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/entities/auth/api/auth.service';
import { pacienteService } from '@/entities/paciente/api/paciente.service';
import { LoadingScreen, ErrorScreen } from '@/shared/ui';

export function HistorialClinicoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<any>(null);

  const cargarHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const perfil = await authService.getFullProfile();
      const pacienteId = (perfil as any).id;
      if (!pacienteId) { setError('No se pudo identificar al paciente.'); setLoading(false); return; }
      const data = await pacienteService.obtenerHistorialClinico(pacienteId);
      setHistorial(data);
    } catch (err: any) {
      setError(err?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarHistorial(); }, []);

  if (loading) return <LoadingScreen fullScreen message="Cargando..." />;
  if (error || !historial) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </Pressable>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 }}>Historial Clínico</Text>
      </View>
      <ErrorScreen title="Historial no disponible" message={error || 'No se pudo cargar la información.'} onRetry={cargarHistorial} style={{ flex: 1 }} />
    </SafeAreaView>
  );

  const consultas = historial.consultas || [];
  const info = historial.informacionComplementaria;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </Pressable>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 }}>Historial Clínico</Text>
        <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>Tus consultas odontológicas</Text>
      </View>

      {/* Patient summary */}
      <View style={{ marginHorizontal: 20, marginTop: -12, marginBottom: 4 }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF0F7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person-outline" size={22} color="#FF4FA3" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>{info?.nombreCompleto || 'Paciente'}</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{info?.edad || '?'} años · {info?.grupoEtario || ''}</Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#EBFFFD', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#38D6C4', lineHeight: 20 }}>{consultas.length}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#38D6C4', textTransform: 'uppercase', letterSpacing: 0.5 }}>{consultas.length === 1 ? 'Consulta' : 'Consultas'}</Text>
          </View>
        </View>
      </View>

      {/* Timeline ScrollView */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}>
        {consultas.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={{ color: '#9CA3AF', fontSize: 15, marginTop: 12, textAlign: 'center' }}>No hay consultas registradas en tu historial.</Text>
          </View>
        ) : consultas.map((c: any, i: number) => {
          const f = c.fecha ? new Date(c.fecha) : null;
          const fStr = f ? `${f.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][f.getMonth()]} ${f.getFullYear()}` : '-- --- ----';
          const num = (i+1).toString().padStart(2, '0');

          const motivo = c.motivoConsulta || '(Sin motivo)';
          const enfermedad = c.enfermedadActual || {};
          const tratamientos = c.tratamientos || [];
          const primerTratamiento = tratamientos[0] || {};
          const procedimientos = primerTratamiento.procedimientos || [];
          const prescripciones = primerTratamiento.prescripciones || [];
          const diagnosticosComplicaciones = primerTratamiento.diagnosticosComplicaciones || '';

          const diagTexto = enfermedad.descripcion || diagnosticosComplicaciones || '(Sin diagnóstico)';
          const trataTexto = procedimientos.join(', ') || '(Sin tratamiento)';
          const recetaTexto = prescripciones.join(', ');
          const drNombre = c.doctor?.usuario?.nombre || c.doctor?.nombre || '';
          const drApellido = c.doctor?.usuario?.apellido || c.doctor?.apellido || '';

          return (
            <View key={c._id || i} style={{ flexDirection: 'row', marginBottom: 24 }}>
              {/* Timeline column */}
              <View style={{ alignItems: 'center', width: 56 }}>
                <View style={{ flex: 1, width: 2, backgroundColor: '#E5E7EB' }} />
                <View style={{ width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF4FA3', borderWidth: 2, borderColor: '#FF4FA3', zIndex: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>{num}</Text>
                </View>
                {i < consultas.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: '#E5E7EB' }} /> : <View style={{ flex: 1, width: 2, opacity: 0 }} />}
              </View>

              {/* Card */}
              <View style={{ flex: 1, paddingRight: 4 }}>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
                  <View style={{ height: 6, backgroundColor: '#FF4FA3' }} />
                  <View style={{ padding: 16, paddingTop: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#EBFFFD', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="calendar-outline" size={16} color="#38D6C4" />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>{fStr}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6B7280" style={{ marginTop: 2 }} />
                      <Text style={{ fontSize: 14, color: '#0F172A', flex: 1 }}>{motivo}</Text>
                    </View>

                    {drNombre ? (
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        <Ionicons name="medkit-outline" size={13} color="#9CA3AF" />
                        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Dr. {drNombre} {drApellido}</Text>
                      </View>
                    ) : null}

                    <View style={{ backgroundColor: '#FFF1F2', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: '#FF4FA3', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#FFE4EC', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="search-outline" size={13} color="#FF4FA3" />
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#FF4FA3', textTransform: 'uppercase', letterSpacing: 0.5 }}>Diagnóstico</Text>
                      </View>
                      <Text style={{ fontSize: 14, color: '#0F172A', lineHeight: 20 }}>{diagTexto}</Text>
                      {enfermedad.observaciones ? (
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 6, fontStyle: 'italic' }}>{enfermedad.observaciones}</Text>
                      ) : null}
                      {enfermedad.tiempoEvolucion ? (
                        <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Evolución: {enfermedad.tiempoEvolucion} {parseInt(enfermedad.tiempoEvolucion) === 1 ? 'día' : 'días'}</Text>
                      ) : null}
                    </View>

                    <View style={{ backgroundColor: '#F0FDFA', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: '#38D6C4', marginBottom: recetaTexto ? 12 : 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="bandage-outline" size={13} color="#38D6C4" />
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#38D6C4', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tratamiento</Text>
                      </View>
                      <Text style={{ fontSize: 14, color: '#0F172A', lineHeight: 20 }}>{trataTexto}</Text>
                    </View>

                    {recetaTexto ? (
                      <View style={{ backgroundColor: '#F5F3FF', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: '#8B5CF6' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="medical-outline" size={13} color="#8B5CF6" />
                          </View>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: 0.5 }}>Prescripción</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: '#0F172A', lineHeight: 20 }}>{recetaTexto}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
