import { apiClient } from '@/shared/api/apiClient';
import { CrearCitaRequest, Cita, Paciente, DoctorItem, MisCitasResponse, CitaDoctor } from '../model/citas.types';

export const citasService = {
  async agendarCita(data: CrearCitaRequest): Promise<Cita> {
    const response = await apiClient.post<any>('/citas', data);
    return response.data.datos;
  },

  async obtenerPacientes(): Promise<Paciente[]> {
    const response = await apiClient.get<any>('/pacientes');
    return response.data.datos || response.data.data || [];
  },

  async obtenerDoctores(): Promise<DoctorItem[]> {
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
    const response = await apiClient.get<any>('/citas/doctor', { params });
    return response.data.datos || response.data;
  },

  async obtenerCitasPorDoctorYFecha(doctorId: string, fecha: string): Promise<Cita[]> {
    const response = await apiClient.get<any>(`/citas?doctor=${doctorId}&fecha=${fecha}`);
    return response.data.datos || response.data.data || [];
  },

  async obtenerPerfilDoctor(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/doctores/${id}`);
    return response.data.data || response.data.datos || response.data;
  },

  async cancelarCita(citaId: string, motivoCancelacion: string): Promise<void> {
    await apiClient.delete(`/citas/${citaId}`, {
      data: { motivoCancelacion },
    });
  },
};
