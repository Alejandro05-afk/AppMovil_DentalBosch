import { apiClient } from '@/shared/api/apiClient';
import { supabaseCitasService } from './supabaseCitas.service';
import { CrearCitaRequest, Cita, Paciente, DoctorItem, MisCitasResponse, CitaDoctor } from '../model/citas.types';

const AUTH_PROVIDER = process.env.EXPO_PUBLIC_AUTH_PROVIDER || 'backend';

export const citasService = {
  async agendarCita(data: CrearCitaRequest): Promise<Cita> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseCitasService.agendarCita(data);
    }
    const response = await apiClient.post<any>('/citas', data);
    return response.data.datos;
  },

  async obtenerPacientes(): Promise<Paciente[]> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseCitasService.obtenerPacientes();
    }
    const response = await apiClient.get<any>('/pacientes');
    return response.data.datos || response.data.data || [];
  },

  async obtenerDoctores(): Promise<DoctorItem[]> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseCitasService.obtenerDoctores();
    }
    const response = await apiClient.get<any>('/doctores');
    return response.data.datos || response.data.data || [];
  },

  async obtenerMisCitas(params?: {
    estado?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }): Promise<MisCitasResponse> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseCitasService.obtenerMisCitas(params);
    }
    const response = await apiClient.get<any>('/citas/mis-citas', { params });
    return response.data.datos;
  },

  async obtenerCitasDoctor(params?: {
    estado?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }): Promise<{ citas: CitaDoctor[]; pagination?: any }> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseCitasService.obtenerCitasDoctor(params);
    }
    const response = await apiClient.get<any>('/citas/doctor', { params });
    return response.data.datos || response.data;
  },

  async obtenerSlotsOcupados(doctorId: string, fecha: string): Promise<string[]> {
    if (AUTH_PROVIDER === 'supabase') {
      const citas = await supabaseCitasService.obtenerCitasPorDoctorYFecha(doctorId, fecha);
      return citas.map((c) => c.horaInicio);
    }
    const response = await apiClient.get<any>('/citas/slots-ocupados', {
      params: { doctor: doctorId, fecha },
    });
    return response.data.datos?.slotsOcupados || [];
  },

  async obtenerPerfilDoctor(id: string): Promise<any> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseCitasService.obtenerPerfilDoctor(id);
    }
    const response = await apiClient.get<any>(`/doctores/${id}`);
    return response.data.data || response.data.datos || response.data;
  },

  async cancelarCita(citaId: string, motivoCancelacion: string): Promise<void> {
    if (AUTH_PROVIDER === 'supabase') {
      return supabaseCitasService.cancelarCita(citaId, motivoCancelacion);
    }
    await apiClient.delete(`/citas/${citaId}`, {
      data: { motivoCancelacion },
    });
  },
};
